# -*- coding: utf-8 -*-
"""
Pivot Table, Graph View, and Group-By Jalali Formatter - Odoo 19
Translates grouped date labels in Pivot tables, Graph views, and List views
so that grouping by month, quarter, or year shows Persian names:
- Month: 'فروردین ۱۴۰۵' instead of 'March 2026'
- Year: '۱۴۰۵' instead of '2026'
- Quarter: 'سه‌ماهه اول ۱۴۰۵' instead of 'Q1 2026'
- Day: '۱۴۰۵/۰۱/۰۱' instead of '2026-03-21'
"""

import logging
from datetime import datetime, date
from odoo import models, api, fields
from .jalaali_mixin import _py_gregorian_to_jalali

_logger = logging.getLogger(__name__)

PERSIAN_MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

PERSIAN_DIGITS = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
}


def _to_persian_digits(s):
    return "".join(PERSIAN_DIGITS.get(ch, ch) for ch in str(s))


class BaseModelJalaaliGroupBy(models.AbstractModel):
    _inherit = 'base'

    @api.model
    def _read_group_format_result(self, data_point, annotated_groupbys, groupby_types):
        """
        Intercepts the display formatting of grouped rows in Pivot tables,
        Graph views, and grouped Tree/List views.
        """
        result = super()._read_group_format_result(data_point, annotated_groupbys, groupby_types)

        user = self.env.user
        lang = self.env.context.get('lang') or user.lang or ''
        mode = getattr(user, 'jalali_calendar_mode', 'shamsi') or 'shamsi'

        if mode == 'gregorian' or (not lang.startswith('fa') and not user.jalali_date_format):
            return result

        use_persian_nums = user.jalali_use_persian_numbers

        for key, val in list(result.items()):
            # Look for date grouping keys like 'date_order:month', 'create_date:year'
            if any(grain in key for grain in (':month', ':year', ':quarter', ':week', ':day')):
                raw_val = data_point.get(key)
                if not raw_val:
                    continue

                try:
                    # Parse raw_val into date object
                    g_date = None
                    if isinstance(raw_val, datetime):
                        # Localize UTC datetime to user's timezone before taking the date
                        localized_dt = fields.Datetime.context_timestamp(self, raw_val)
                        g_date = localized_dt.date()
                    elif isinstance(raw_val, date):
                        g_date = raw_val
                    elif isinstance(raw_val, int):
                        g_date = date(raw_val, 1, 1)
                    elif isinstance(raw_val, str):
                        s = raw_val.strip()
                        if len(s) == 4 and s.isdigit():
                            g_date = date(int(s), 1, 1)
                        elif len(s) >= 7 and s[:4].isdigit() and s[4] in ('-', '/') and s[5:7].isdigit():
                            g_date = date(int(s[:4]), int(s[5:7]), 1)
                        else:
                            try:
                                g_date = datetime.strptime(s[:10], '%Y-%m-%d').date()
                            except ValueError:
                                pass

                    if g_date:
                        jy, jm, jd = _py_gregorian_to_jalali(g_date.year, g_date.month, g_date.day)

                        if ':month' in key:
                            label = f"{PERSIAN_MONTH_NAMES[jm - 1]} {jy}"
                            if use_persian_nums:
                                label = _to_persian_digits(label)
                            if mode == 'both':
                                label = f"{label} ({g_date.strftime('%B %Y')})"
                            result[key] = label

                        elif ':year' in key:
                            label = str(jy)
                            if use_persian_nums:
                                label = _to_persian_digits(label)
                            if mode == 'both':
                                label = f"{label} ({g_date.year})"
                            result[key] = label

                        elif ':quarter' in key:
                            quarter_num = (jm - 1) // 3 + 1
                            q_names = ['اول', 'دوم', 'سوم', 'چهارم']
                            label = f"سه‌ماهه {q_names[quarter_num - 1]} {jy}"
                            if use_persian_nums:
                                label = _to_persian_digits(label)
                            if mode == 'both':
                                label = f"{label} (Q{quarter_num} {g_date.year})"
                            result[key] = label

                        elif ':week' in key:
                            # Calculate week number in Jalali year
                            day_of_year = (jm - 1) * 31 + jd if jm <= 6 else 186 + (jm - 7) * 30 + jd
                            week_no = (day_of_year - 1) // 7 + 1
                            label = f"هفته {week_no} سال {jy}"
                            if use_persian_nums:
                                label = _to_persian_digits(label)
                            if mode == 'both':
                                label = f"{label} (W{g_date.isocalendar()[1]} {g_date.year})"
                            result[key] = label

                        elif ':day' in key:
                            label = f"{jy}/{jm:02d}/{jd:02d}"
                            if use_persian_nums:
                                label = _to_persian_digits(label)
                            if mode == 'both':
                                label = f"{label} ({g_date.strftime('%Y-%m-%d')})"
                            result[key] = label

                except Exception as e:
                    _logger.debug("Failed formatting Jalali group by: %s", str(e))

        return result
