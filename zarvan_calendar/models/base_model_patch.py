# -*- coding: utf-8 -*-
"""
Unified Base Model Core Interceptor for Odoo 20
Integrates Search Query Rewriter, SQL Query Builder (_where_calc),
and Pivot Table / Graph / Group-By Formatters into a single high-performance hook.
"""

import re
import logging
from datetime import datetime, date
from odoo import models, api, fields
from .jalaali_mixin import _py_jalali_to_gregorian, _py_gregorian_to_jalali, PERSIAN_AND_ARABIC_DIGITS, _normalize_persian_str

_logger = logging.getLogger(__name__)

PERSIAN_MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]


def _convert_single_date(val, is_datetime=False, operator='='):
    """Parses a potential Jalali date string and converts it to Gregorian ISO using pure Python."""
    if not isinstance(val, str):
        return val

    cleaned = _normalize_persian_str(val)

    def _format_result(g_date, time_part):
        g_str = g_date.strftime('%Y-%m-%d')
        if not is_datetime:
            return g_str
        if time_part:
            return f"{g_str} {time_part}"
        if operator in ('<=', '>'):
            return f"{g_str} 23:59:59"
        elif operator in ('>=', '<'):
            return f"{g_str} 00:00:00"
        else:
            return g_str

    # 1. Match YYYY-MM-DD or YYYY/MM/DD with optional HH:MM[:SS]
    m1 = re.match(r'^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?))?$', cleaned)
    if m1:
        y, month, day = int(m1.group(1)), int(m1.group(2)), int(m1.group(3))
        time_part = m1.group(4)
        if 1300 <= y <= 1500 and 1 <= month <= 12 and 1 <= day <= 31:
            try:
                g_date = _py_jalali_to_gregorian(y, month, day)
                return _format_result(g_date, time_part)
            except Exception:
                pass

    # 2. Match 8-digit compact: 14050115
    m2 = re.match(r'^(\d{4})(\d{2})(\d{2})$', cleaned)
    if m2:
        y, month, day = int(m2.group(1)), int(m2.group(2)), int(m2.group(3))
        if 1300 <= y <= 1500 and 1 <= month <= 12 and 1 <= day <= 31:
            try:
                g_date = _py_jalali_to_gregorian(y, month, day)
                return _format_result(g_date, None)
            except Exception:
                pass

    # 3. Match D/M/YYYY or DD/MM/YYYY (e.g. 1/1/1405 or 15/01/1405)
    m3 = re.match(r'^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?))?$', cleaned)
    if m3:
        day, month, y = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
        time_part = m3.group(4)
        if 1300 <= y <= 1500 and 1 <= month <= 12 and 1 <= day <= 31:
            try:
                g_date = _py_jalali_to_gregorian(y, month, day)
                return _format_result(g_date, time_part)
            except Exception:
                pass

    return val


class BaseModelJalaaliPatch(models.AbstractModel):
    _inherit = 'base'

    @api.model
    def _convert_jalali_domain(self, domain):
        """
        Recursively traverses search domains, translating any Shamsi date operands
        to Gregorian before passing to PostgreSQL.
        """
        if not domain or not isinstance(domain, (list, tuple)):
            return domain

        new_domain = []
        for item in domain:
            if isinstance(item, (list, tuple)):
                if len(item) == 3 and isinstance(item[0], str) and isinstance(item[1], str):
                    field_name, operator, value = item
                    field = None
                    if hasattr(self, '_fields'):
                        if '.' in field_name:
                            # Traverse related dot-paths like 'partner_id.create_date'
                            curr_model = self
                            for part in field_name.split('.'):
                                if hasattr(curr_model, '_fields') and part in curr_model._fields:
                                    field = curr_model._fields[part]
                                    if field.relational and hasattr(self, 'env') and field.comodel_name in self.env:
                                        curr_model = self.env[field.comodel_name]
                                else:
                                    field = None
                                    break
                        else:
                            field = self._fields.get(field_name)

                    if field:
                        is_candidate = field.type in ('date', 'datetime')
                    else:
                        leaf = field_name.split('.')[-1].lower()
                        is_candidate = (
                            leaf.endswith('_date') or leaf.startswith('date_') or
                            leaf in ('date', 'deadline', 'create_date', 'write_date', 'date_order', 'invoice_date')
                        )

                    if is_candidate:
                        is_dt = bool(field and field.type == 'datetime')
                        if isinstance(value, str):
                            value = _convert_single_date(value, is_datetime=is_dt, operator=operator)
                        elif isinstance(value, (list, tuple)):
                            value = [_convert_single_date(v, is_datetime=is_dt, operator=operator) for v in value]

                        item = (field_name, operator, value)
                    new_domain.append(item)
                else:
                    new_domain.append(self._convert_jalali_domain(item))
            else:
                new_domain.append(item)

        return new_domain

    @api.model
    def _where_calc(self, domain):
        """Intercepts query builder to translate Shamsi inputs to Gregorian in all SQL queries."""
        try:
            domain = self._convert_jalali_domain(domain)
        except Exception as e:
            _logger.warning("Error rewriting Jalali domain in _where_calc: %s", str(e))
        return super()._where_calc(domain)

    @api.model
    def _search(self, domain, offset=0, limit=None, order=None, **kwargs):
        """Intercepts search to translate Shamsi inputs to Gregorian SQL domains."""
        try:
            domain = self._convert_jalali_domain(domain)
        except Exception as e:
            _logger.warning("Error rewriting Jalali search domain: %s", str(e))
        return super()._search(domain, offset=offset, limit=limit, order=order, **kwargs)

    @api.model
    def _read_group_format_result(self, data_point, annotated_groupbys, groupby_types):
        """
        Intercepts the display formatting of grouped rows in Pivot tables,
        Graph views, and grouped Tree/List views for Odoo 20.
        """
        result = super()._read_group_format_result(data_point, annotated_groupbys, groupby_types)

        user = self.env.user
        lang = self.env.context.get('lang') or user.lang or ''
        mode = getattr(user, 'jalali_calendar_mode', 'shamsi') or 'shamsi'

        if mode == 'gregorian' or (not lang.startswith('fa') and not user.jalali_date_format):
            return result

        for key in list(result.keys()):
            if any(grain in key for grain in (':month', ':year', ':quarter', ':week', ':day')):
                raw_val = data_point.get(key)
                if not raw_val:
                    continue

                try:
                    g_date = None
                    if isinstance(raw_val, datetime):
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
                            if mode == 'both':
                                label = f"{label} ({g_date.strftime('%B %Y')})"
                            result[key] = label

                        elif ':year' in key:
                            label = str(jy)
                            if mode == 'both':
                                label = f"{label} ({g_date.year})"
                            result[key] = label

                        elif ':quarter' in key:
                            quarter_num = (jm - 1) // 3 + 1
                            q_names = ['اول', 'دوم', 'سوم', 'چهارم']
                            label = f"سه‌ماهه {q_names[quarter_num - 1]} {jy}"
                            if mode == 'both':
                                label = f"{label} (Q{quarter_num} {g_date.year})"
                            result[key] = label

                        elif ':week' in key:
                            day_of_year = (jm - 1) * 31 + jd if jm <= 6 else 186 + (jm - 7) * 30 + jd
                            week_no = (day_of_year - 1) // 7 + 1
                            label = f"هفته {week_no} سال {jy}"
                            if mode == 'both':
                                label = f"{label} (W{g_date.isocalendar()[1]} {g_date.year})"
                            result[key] = label

                        elif ':day' in key:
                            label = f"{jy}/{jm:02d}/{jd:02d}"
                            if mode == 'both':
                                label = f"{label} ({g_date.strftime('%Y-%m-%d')})"
                            result[key] = label

                except Exception as e:
                    _logger.debug("Failed formatting Jalali group by: %s", str(e))

        return result
