# -*- coding: utf-8 -*-
"""
Universal Excel and CSV Import Jalali Interceptor - Odoo 20
Hooks into Odoo's native 'base_import.import' engine so that ANY
Excel (.xlsx, .xls) or CSV file imported into ANY Odoo model (Contacts,
Sales, Invoices, Stock, Products, etc.) automatically detects and
converts Shamsi dates to Gregorian!

Supports:
- Numeric formats: YYYY/MM/DD, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, YYYYMMDD
- Persian Numerals (۰–۹)
- Persian Month Names (e.g. '۱۵ فروردین ۱۴۰۵' or '15 Farvardin 1405')
"""

import re
import logging
from odoo import models, api
from .jalaali_mixin import _py_jalali_to_gregorian, _normalize_persian_str

_logger = logging.getLogger(__name__)

PERSIAN_MONTH_MAP = {
    'فروردین': 1, 'اردیبهشت': 2, 'خرداد': 3,
    'تیر': 4, 'مرداد': 5, 'شهریور': 6,
    'مهر': 7, 'آبان': 8, 'آذر': 9,
    'دی': 10, 'بهمن': 11, 'اسفند': 12,
    'farvardin': 1, 'ordibehesht': 2, 'khordad': 3,
    'tir': 4, 'mordad': 5, 'shahrivar': 6,
    'mehr': 7, 'aban': 8, 'azar': 9,
    'dey': 10, 'bahman': 11, 'esfand': 12,
}


def _clean_persian_digits(val):
    s = str(val).strip()
    if s.endswith('.0') and s[:-2].isdigit():
        s = s[:-2]
    return _normalize_persian_str(s)


def _parse_jalali_to_gregorian_str(raw_val, field_type='date'):
    """Tries multiple parsing strategies on raw Excel/CSV cell value."""
    if not raw_val:
        return raw_val

    cleaned = _clean_persian_digits(raw_val)

    # Strategy 1: YYYY/MM/DD or YYYY-MM-DD
    m1 = re.match(r'^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?))?$', cleaned)
    if m1:
        y, m, d = int(m1.group(1)), int(m1.group(2)), int(m1.group(3))
        time_part = m1.group(4)
        if 1300 <= y <= 1500 and 1 <= m <= 12 and 1 <= d <= 31:
            try:
                g = _py_jalali_to_gregorian(y, m, d)
                res = g.strftime('%Y-%m-%d')
                if time_part and field_type == 'datetime':
                    res = f"{res} {time_part}"
                return res
            except Exception:
                pass

    # Strategy 2: DD/MM/YYYY or DD-MM-YYYY
    m2 = re.match(r'^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?))?$', cleaned)
    if m2:
        d, m, y = int(m2.group(1)), int(m2.group(2)), int(m2.group(3))
        time_part = m2.group(4)
        if 1300 <= y <= 1500 and 1 <= m <= 12 and 1 <= d <= 31:
            try:
                g = _py_jalali_to_gregorian(y, m, d)
                res = g.strftime('%Y-%m-%d')
                if time_part and field_type == 'datetime':
                    res = f"{res} {time_part}"
                return res
            except Exception:
                pass

    # Strategy 3: Compact 8-digit (14050115)
    m3 = re.match(r'^(\d{4})(\d{2})(\d{2})$', cleaned)
    if m3:
        y, m, d = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
        if 1300 <= y <= 1500 and 1 <= m <= 12 and 1 <= d <= 31:
            try:
                return _py_jalali_to_gregorian(y, m, d).strftime('%Y-%m-%d')
            except Exception:
                pass

    # Strategy 4: Named Month (e.g. '15 فروردین 1405' or '15 Farvardin 1405')
    for month_name, month_num in PERSIAN_MONTH_MAP.items():
        if month_name in cleaned.lower():
            # Extract day and year numbers
            digits = re.findall(r'\d+', cleaned)
            if len(digits) >= 2:
                # One is year (around 1400), other is day (1..31)
                nums = [int(x) for x in digits]
                years = [n for n in nums if 1300 <= n <= 1500]
                days = [n for n in nums if 1 <= n <= 31 and n not in years]
                if years and days:
                    try:
                        g = _py_jalali_to_gregorian(years[0], month_num, days[0])
                        return g.strftime('%Y-%m-%d')
                    except Exception:
                        pass

    return raw_val


class BaseImport(models.TransientModel):
    _inherit = 'base_import.import'

    def _parse_date_from_data(self, data, index, name, field_type, options):
        """
        Intercepts date parsing during native Odoo Excel/CSV imports.
        Converts any Shamsi date to Gregorian string before validation.
        """
        for row in data:
            if index < len(row) and row[index]:
                val = str(row[index]).strip()
                converted = _parse_jalali_to_gregorian_str(val, field_type=field_type)
                if converted != val:
                    row[index] = converted

        return super()._parse_date_from_data(data, index, name, field_type, options)
