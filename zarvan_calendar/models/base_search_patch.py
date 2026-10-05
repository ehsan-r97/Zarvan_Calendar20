# -*- coding: utf-8 -*-
"""
Enterprise Search Query Jalali-to-Gregorian Domain Rewriter - Odoo 20
Ensures PostgreSQL always queries indexed B-Tree columns in native Gregorian UTC,
while allowing users to filter using any Shamsi date format:
- Recursive domain support for nested '&' and '|' trees and expression.Domain objects
- Accurate user timezone-aware UTC datetime boundary conversion (e.g. Asia/Tehran UTC+03:30)
- List operand support for 'in' and 'not in' operators
- Compact 8-digit support (e.g. 14050101) alongside YYYY/MM/DD and YYYY-MM-DD
- Normalization of Persian numerals (۰–۹)
"""

import re
import logging
from datetime import datetime, date
from odoo import models, api, fields
from .jalaali_mixin import _py_jalali_to_gregorian

_logger = logging.getLogger(__name__)

DIGIT_MAP = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}


def _normalize_persian_str(val):
    if not isinstance(val, str):
        return val
    cleaned = val.strip()
    for p_char, l_char in DIGIT_MAP.items():
        cleaned = cleaned.replace(p_char, l_char)
    return cleaned


def _convert_single_date(val, is_datetime=False, operator='=', user_tz=None):
    """
    Parses a potential Jalali date string and converts it to Gregorian ISO.
    For datetime fields, converts local user timezone to UTC timestamp.
    """
    if not isinstance(val, str):
        return val

    cleaned = _normalize_persian_str(val)

    def _format_result(g_date, time_part):
        g_str = g_date.strftime('%Y-%m-%d')
        if not is_datetime:
            return g_str

        if time_part:
            tp = [int(p) for p in time_part.split(':')]
            h = tp[0] if len(tp) > 0 else 0
            mi = tp[1] if len(tp) > 1 else 0
            s = tp[2] if len(tp) > 2 else 0
        elif operator in ('<=', '>'):
            h, mi, s = 23, 59, 59
        elif operator in ('>=', '<'):
            h, mi, s = 0, 0, 0
        else:
            h, mi, s = 0, 0, 0

        # Timezone localization to UTC for PostgreSQL datetime query
        if user_tz:
            try:
                import pytz
                local_tz = pytz.timezone(user_tz)
                local_dt = local_tz.localize(datetime(g_date.year, g_date.month, g_date.day, h, mi, s))
                utc_dt = local_dt.astimezone(pytz.utc)
                return utc_dt.strftime('%Y-%m-%d %H:%M:%S')
            except Exception:
                pass

        return f"{g_str} {h:02d}:{mi:02d}:{s:02d}"

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


class BaseModelJalaaliSearch(models.AbstractModel):
    _inherit = 'base'

    @api.model
    def _convert_jalali_domain(self, domain):
        """
        Recursively traverses search domains, translating any Shamsi date operands
        to Gregorian UTC before passing to PostgreSQL.
        """
        if not domain:
            return domain

        # Handle expression.Domain objects in modern Odoo 17/18/19/20
        if hasattr(domain, 'tolist'):
            domain = domain.tolist()
        elif not isinstance(domain, (list, tuple)):
            return domain

        user_tz = self.env.context.get('tz') or (self.env.user.tz if hasattr(self.env.user, 'tz') else None) or 'Asia/Tehran'

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
                            value = _convert_single_date(value, is_datetime=is_dt, operator=operator, user_tz=user_tz)
                        elif isinstance(value, (list, tuple)):
                            value = [_convert_single_date(v, is_datetime=is_dt, operator=operator, user_tz=user_tz) for v in value]

                        item = (field_name, operator, value)
                    new_domain.append(item)
                else:
                    # Recursive for nested domain lists
                    new_domain.append(self._convert_jalali_domain(item))
            else:
                new_domain.append(item)

        return new_domain

    @api.model
    def _search(self, domain, offset=0, limit=None, order=None, **kwargs):
        """Intercepts search to translate Shamsi inputs to Gregorian SQL domains."""
        try:
            domain = self._convert_jalali_domain(domain)
        except Exception as e:
            _logger.warning("Error rewriting Jalali search domain: %s", str(e))
        return super()._search(domain, offset=offset, limit=limit, order=order, **kwargs)
