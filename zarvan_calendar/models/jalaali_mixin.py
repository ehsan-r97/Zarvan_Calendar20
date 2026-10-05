# -*- coding: utf-8 -*-
"""
Jalali Calendar Mixin - Odoo 20
Provides cached conversion routines and date detection helpers.
"""

import logging
import re
from datetime import datetime, date
from odoo import models, fields, api
from odoo.tools import ormcache

_logger = logging.getLogger(__name__)



# Ultra-fast thread-safe integer bitwise caches (nano-second retrieval)
_FAST_CACHE_G2J = {}
_FAST_CACHE_J2G = {}
_MAX_FAST_CACHE_SIZE = 5000

PERSIAN_AND_ARABIC_DIGITS = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}


def _normalize_persian_str(val):
    """Normalizes Persian (۰-۹) and Arabic (٠-٩) numerals into standard Latin (0-9) digits."""
    if not isinstance(val, str):
        return val
    cleaned = val.strip()
    for p_char, l_char in PERSIAN_AND_ARABIC_DIGITS.items():
        cleaned = cleaned.replace(p_char, l_char)
    return cleaned


# High-precision pure-Python Khayyam-Birashk algorithm (No external dependencies needed)
def _py_jalali_to_gregorian(jy, jm, jd):
    key = (jy << 9) | (jm << 5) | jd
    hit = _FAST_CACHE_J2G.get(key)
    if hit is not None:
        return hit

    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    jy_calc = jy + 1595
    days = -355668 + (365 * jy_calc) + (jy_calc // 33 * 8) + (((jy_calc % 33) + 3) // 4) + jd
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
    res = date(gy, gm, gd)
    if len(_FAST_CACHE_J2G) < _MAX_FAST_CACHE_SIZE:
        _FAST_CACHE_J2G[key] = res
    return res


def _py_gregorian_to_jalali(gy, gm, gd):
    key = (gy << 9) | (gm << 5) | gd
    hit = _FAST_CACHE_G2J.get(key)
    if hit is not None:
        return hit

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
    res = (jy, jm, jd)
    if len(_FAST_CACHE_G2J) < _MAX_FAST_CACHE_SIZE:
        _FAST_CACHE_G2J[key] = res
    return res



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
            return _py_jalali_to_gregorian(j_year, j_month, j_day)
        except (ValueError, IndexError, OverflowError):
            return False

    @api.model
    @ormcache('g_year', 'g_month', 'g_day')
    def _gregorian_to_jalali_cached(self, g_year, g_month, g_day):
        """Converts Gregorian date components to (jy, jm, jd) tuple with ormcache."""
        try:
            return _py_gregorian_to_jalali(g_year, g_month, g_day)
        except (ValueError, IndexError, OverflowError):
            return False


    @api.model
    def jalali_to_gregorian(self, j_year, j_month, j_day):
        """Public method converting Jalali components to Gregorian date object."""
        try:
            return self._jalali_to_gregorian_cached(int(j_year), int(j_month), int(j_day))
        except Exception:
            return False

    @api.model
    def gregorian_to_jalali(self, g_year, g_month, g_day):
        """Public method converting Gregorian components to (jy, jm, jd) tuple."""
        try:
            return self._gregorian_to_jalali_cached(int(g_year), int(g_month), int(g_day))
        except Exception:
            return False

    @api.model
    def _jalali_to_gregorian(self, jalali_date_str):
        """String-based compatibility helper for string date inputs ('YYYY-MM-DD', 'YYYY/MM/DD')."""
        if not jalali_date_str:
            return None
        res = self.detect_and_parse_date(str(jalali_date_str), force_jalali=True)
        return res if res else None

    @api.model
    def _gregorian_to_jalali(self, gregorian_date):
        """String-based compatibility helper returning 'YYYY-MM-DD' formatted string."""
        if not gregorian_date:
            return None
        if hasattr(gregorian_date, 'year'):
            gy, gm, gd = gregorian_date.year, gregorian_date.month, gregorian_date.day
        else:
            parsed = self.detect_and_parse_date(str(gregorian_date), force_gregorian=True)
            if not parsed:
                return None
            gy, gm, gd = parsed.year, parsed.month, parsed.day
        res = self.gregorian_to_jalali(gy, gm, gd)
        if not res:
            return None
        jy, jm, jd = res
        return f"{jy:04d}-{jm:02d}-{jd:02d}"

    @api.model
    def _validate_jalali_date(self, jalali_date_str, field_name="Date"):
        """Validates date string and raises ValidationError if invalid."""
        from odoo.exceptions import ValidationError
        if not jalali_date_str:
            raise ValidationError(f"Invalid {field_name}: empty date")
        parsed = self._jalali_to_gregorian(jalali_date_str)
        if not parsed:
            raise ValidationError(f"Invalid Jalali date format for {field_name}: {jalali_date_str}")
        return True

    @api.model
    def is_jalali_leap_year(self, j_year):
        """Returns True if j_year is a leap year (30 days in Esfand). Pure Python."""
        return _py_is_jalali_leap(int(j_year))

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

        # Convert Persian and Arabic numerals to Latin digits
        cleaned = _normalize_persian_str(str(date_string).split(' ')[0].split('T')[0])

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
