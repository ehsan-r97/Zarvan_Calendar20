# -*- coding: utf-8 -*-
"""
Jalali Calendar Mixin - Odoo 19
Provides cached conversion routines and date detection helpers.
"""

import logging
import re
from datetime import datetime, date
from odoo import models, fields, api
from odoo.tools import ormcache

try:
    import jdatetime
    HAS_JDATETIME = True
except ImportError:
    HAS_JDATETIME = False

_logger = logging.getLogger(__name__)


# High-precision pure-Python Khayyam-Birashk algorithm (No external dependencies needed)
def _py_jalali_to_gregorian(jy, jm, jd):
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    jy += 1595
    days = -355668 + (365 * jy) + (jy // 33 * 8) + (((jy % 33) + 3) // 4) + jd
    if jm < 7:
        days += (jm - 1) * 31
    else:
        days += ((jm - 7) * 30) + 186
    gy = 400 * (days // 146097)
    days %= 146097
    if days > 36524:
        days -= 1
        gy += 100 * (days // 36524)
        days %= 36524
        if days >= 365:
            days += 1
    gy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        gy += (days - 1) // 365
        days = (days - 1) % 365
    gd = days + 1
    gm = 0
    leap = (gy % 4 == 0 and gy % 100 != 0) or (gy % 400 == 0)
    for i in range(12):
        dim = 29 if (i == 1 and leap) else ([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i])
        if gd <= dim:
            gm = i + 1
            break
        gd -= dim
    return date(gy, gm, gd)


def _py_gregorian_to_jalali(gy, gm, gd):
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + g_d_m[gm - 1]
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm = 1 + (days // 31)
        jd = 1 + (days % 31)
    else:
        jm = 7 + ((days - 186) // 30)
        jd = 1 + ((days - 186) % 30)
    return (jy, jm, jd)


def _py_is_jalali_leap(jy):
    return (jy % 33 in [1, 5, 9, 13, 17, 22, 26, 30])


class JalaaliMixin(models.AbstractModel):
    _name = 'jalaali.mixin'
    _description = 'Jalali Calendar Mixin'

    @api.model
    @ormcache('j_year', 'j_month', 'j_day')
    def _jalali_to_gregorian_cached(self, j_year, j_month, j_day):
        """Converts Jalali date components to Gregorian date object with ormcache."""
        try:
            if HAS_JDATETIME:
                j_date = jdatetime.date(j_year, j_month, j_day)
                g_date = j_date.togregorian()
                return date(g_date.year, g_date.month, g_date.day)
            return _py_jalali_to_gregorian(j_year, j_month, j_day)
        except (ValueError, IndexError, OverflowError):
            return False

    @api.model
    @ormcache('g_year', 'g_month', 'g_day')
    def _gregorian_to_jalali_cached(self, g_year, g_month, g_day):
        """Converts Gregorian date components to (jy, jm, jd) tuple with ormcache."""
        try:
            if HAS_JDATETIME:
                g_date = date(g_year, g_month, g_day)
                j_date = jdatetime.date.fromgregorian(date=g_date)
                return (j_date.year, j_date.month, j_date.day)
            return _py_gregorian_to_jalali(g_year, g_month, g_day)
        except (ValueError, IndexError, OverflowError):
            return False

    @api.model
    def is_jalali_leap_year(self, j_year):
        """Returns True if j_year is a leap year (30 days in Esfand)."""
        if HAS_JDATETIME:
            try:
                return jdatetime.date(j_year, 12, 30).day == 30
            except ValueError:
                return False
        return _py_is_jalali_leap(j_year)

    @api.model
    def get_days_in_jalali_month(self, j_year, j_month):
        """Returns number of days in specified Jalali month."""
        if 1 <= j_month <= 6:
            return 31
        elif 7 <= j_month <= 11:
            return 30
        elif j_month == 12:
            return 30 if self.is_jalali_leap_year(j_year) else 29
        return 0

    @api.model
    def validate_jalali_date(self, j_year, j_month, j_day):
        """Validates if date is legally possible in Jalali calendar (including leap year)."""
        if not (1 <= j_month <= 12):
            return False
        max_days = self.get_days_in_jalali_month(j_year, j_month)
        return 1 <= j_day <= max_days

    @api.model
    def detect_and_parse_date(self, date_string, force_jalali=False, force_gregorian=False):
        """
        Parses a date string, auto-detecting format based on year value.
        Supports:
          - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
          - DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
          - YYYYMMDD
          - Persian numerals (۰-۹)
        """
        if not date_string:
            return False

        # Convert Persian numerals to Latin
        persian_digits = {'۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                          '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'}
        cleaned = str(date_string).strip().split(' ')[0].split('T')[0]
        for p_char, l_char in persian_digits.items():
            cleaned = cleaned.replace(p_char, l_char)

        # Match Pattern 1: YYYY-MM-DD
        m1 = re.match(r'^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$', cleaned)
        if m1:
            y, m, d = map(int, m1.groups())
        else:
            # Match Pattern 2: DD-MM-YYYY
            m2 = re.match(r'^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$', cleaned)
            if m2:
                d, m, y = map(int, m2.groups())
            else:
                # Match Pattern 3: YYYYMMDD
                m3 = re.match(r'^(\d{4})(\d{2})(\d{2})$', cleaned)
                if m3:
                    y, m, d = map(int, m3.groups())
                else:
                    return False

        if not (1 <= m <= 12 and 1 <= d <= 31):
            return False

        # Jalali years are typically < 1500; Gregorian are > 1900
        is_jalali = force_jalali or (not force_gregorian and y < 1500)

        if is_jalali:
            g_date = self.jalali_to_gregorian(y, m, d)
            return g_date if g_date else False
        else:
            try:
                return date(y, m, d)
            except ValueError:
                return False

    @api.model
    def get_jalali_weekday_name(self, weekday):
        """
        Converts Python weekday (0=Monday, 6=Sunday) to Persian weekday name.
        Shanbeh=0 ... Jomeh=6
        """
        persian_index = (weekday + 2) % 7
        weekdays = [
            'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
        ]
        return weekdays[persian_index]
