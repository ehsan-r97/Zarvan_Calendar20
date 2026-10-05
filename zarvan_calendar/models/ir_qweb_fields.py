# -*- coding: utf-8 -*-
"""
Safe Global QWeb PDF & HTML Report Interceptor - Odoo 20
Supports display modes:
 - 'shamsi': 1405/01/01
 - 'gregorian': 2026-03-21
 - 'both': 1405/01/01 (2026-03-21)
Timezone-safe and non-blocking fallback.
"""

import logging
from odoo import models, fields, api
from .jalaali_mixin import _py_gregorian_to_jalali

_logger = logging.getLogger(__name__)

_QWEB_DATE_CACHE = {}
_QWEB_DATETIME_CACHE = {}
_MAX_QWEB_CACHE = 2000


def _format_digits(text, use_persian):

    if not use_persian:
        return text
    persian_digits = {'0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
                      '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'}
    for en, fa in persian_digits.items():
        text = text.replace(en, fa)
    return text


class IrQWebFieldDate(models.AbstractModel):
    _inherit = 'ir.qweb.field.date'

    @api.model
    def value_to_html(self, value, options):
        """Intercepts date rendering in QWeb reports."""
        if not value:
            return super().value_to_html(value, options)

        try:
            user = self.env.user
            lang = self.env.context.get('lang') or user.lang or ''
            mode = getattr(user, 'jalali_calendar_mode', 'shamsi') or 'shamsi'

            # If user wants Gregorian only or report language is foreign (e.g. English customer invoice)
            if mode == 'gregorian' or not lang.startswith('fa'):
                return super().value_to_html(value, options)

            g_date = None
            if hasattr(value, 'hour') and hasattr(value, 'minute'):
                # Localize UTC datetime to user's timezone before extracting date
                localized = fields.Datetime.context_timestamp(self, value)
                g_date = localized.date()
            elif hasattr(value, 'year'):
                g_date = value
            elif isinstance(value, str):
                if len(value) > 10 and (' ' in value or 'T' in value):
                    raw_dt = fields.Datetime.from_string(value.replace('T', ' '))
                    localized = fields.Datetime.context_timestamp(self, raw_dt)
                    g_date = localized.date()
                else:
                    g_date = fields.Date.from_string(value[:10])
            else:
                g_date = fields.Date.to_date(value)

            if g_date:
                cache_key = (g_date.year, g_date.month, g_date.day, user.jalali_date_format, user.jalali_use_persian_numbers, mode)
                cached = _QWEB_DATE_CACHE.get(cache_key)
                if cached is not None:
                    return cached

                jy, jm, jd = _py_gregorian_to_jalali(g_date.year, g_date.month, g_date.day)
                fmt = user.jalali_date_format or 'YYYY/MM/DD'
                y_str = str(jy)
                m_str = f"{jm:02d}"
                d_str = f"{jd:02d}"

                j_str = fmt.replace('YYYY', y_str).replace('MM', m_str).replace('DD', d_str)
                j_str = _format_digits(j_str, user.jalali_use_persian_numbers)

                if mode == 'both':
                    g_iso = g_date.strftime('%Y-%m-%d')
                    result = f"{j_str} ({g_iso})"
                else:
                    result = j_str

                if len(_QWEB_DATE_CACHE) < _MAX_QWEB_CACHE:
                    _QWEB_DATE_CACHE[cache_key] = result
                return result


        except Exception as e:
            _logger.warning("Jalali QWeb date format error, falling back to standard: %s", str(e))

        return super().value_to_html(value, options)


class IrQWebFieldDateTime(models.AbstractModel):
    _inherit = 'ir.qweb.field.datetime'

    @api.model
    def value_to_html(self, value, options):
        """Intercepts datetime rendering in QWeb reports with timezone conversion."""
        if not value:
            return super().value_to_html(value, options)

        try:
            user = self.env.user
            lang = self.env.context.get('lang') or user.lang or ''
            mode = getattr(user, 'jalali_calendar_mode', 'shamsi') or 'shamsi'

            if mode == 'gregorian' or not lang.startswith('fa'):
                return super().value_to_html(value, options)

            # Convert UTC to user's localized timezone
            raw_dt = fields.Datetime.from_string(value) if isinstance(value, str) else value
            localized_dt = fields.Datetime.context_timestamp(self, raw_dt)

            if localized_dt:
                cache_key = (localized_dt.year, localized_dt.month, localized_dt.day, localized_dt.hour, localized_dt.minute, user.jalali_date_format, user.jalali_use_persian_numbers, mode)
                cached = _QWEB_DATETIME_CACHE.get(cache_key)
                if cached is not None:
                    return cached

                jy, jm, jd = _py_gregorian_to_jalali(localized_dt.year, localized_dt.month, localized_dt.day)
                fmt = user.jalali_date_format or 'YYYY/MM/DD'
                y_str = str(jy)
                m_str = f"{jm:02d}"
                d_str = f"{jd:02d}"

                date_part = fmt.replace('YYYY', y_str).replace('MM', m_str).replace('DD', d_str)
                time_part = f"{localized_dt.hour:02d}:{localized_dt.minute:02d}"
                j_str = f"{date_part} {time_part}"
                j_str = _format_digits(j_str, user.jalali_use_persian_numbers)

                if mode == 'both':
                    g_iso = localized_dt.strftime('%Y-%m-%d %H:%M')
                    result = f"{j_str} ({g_iso})"
                else:
                    result = j_str

                if len(_QWEB_DATETIME_CACHE) < _MAX_QWEB_CACHE:
                    _QWEB_DATETIME_CACHE[cache_key] = result
                return result


        except Exception as e:
            _logger.warning("Jalali QWeb datetime format error, falling back to standard: %s", str(e))

        return super().value_to_html(value, options)
