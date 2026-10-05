# -*- coding: utf-8 -*-
"""
User Preferences for Persian Calendar - Odoo 20
Configures display mode (Shamsi, Gregorian, or Both), date format, and numerals.
"""

from odoo import models, fields, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    JALALI_CALENDAR_MODE_SELECTION = [
        ('shamsi', 'Shamsi Only (e.g. 1405/01/01)'),
        ('gregorian', 'Gregorian Only (e.g. 2026-03-21)'),
        ('both', 'Both (Shamsi with Gregorian in parentheses, e.g. 1405/01/01 (2026-03-21))'),
    ]

    JALALI_DATE_FORMAT_SELECTION = [
        ('YYYY-MM-DD', 'YYYY-MM-DD (e.g. 1405-01-01)'),
        ('YYYY/MM/DD', 'YYYY/MM/DD (e.g. 1405/01/01)'),
        ('YYYYMMDD', 'YYYYMMDD (e.g. 14050101)'),
        ('DD-MM-YYYY', 'DD-MM-YYYY (e.g. 01-01-1405)'),
        ('DD/MM/YYYY', 'DD/MM/YYYY (e.g. 01/01/1405)'),
    ]

    jalali_calendar_mode = fields.Selection(
        selection=JALALI_CALENDAR_MODE_SELECTION,
        string='Calendar Display Mode',
        default='shamsi',
        help="Choose whether dates in the UI and reports display in Shamsi, Gregorian, or Both simultaneously."
    )

    jalali_date_format = fields.Selection(
        selection=JALALI_DATE_FORMAT_SELECTION,
        string='Jalali Date Format',
        default='YYYY/MM/DD',
        help="Preferred Jalali date display format in Odoo views."
    )

    jalali_use_persian_numbers = fields.Boolean(
        string='Use Persian Numbers (۰–۹)',
        default=False,
        help="Display date digits using Persian numerals (۰, ۱, ۲, ...)."
    )

    @api.model
    def _get_session_info(self):
        """Fallback for environments where res.users handles session_info."""
        session_info = super()._get_session_info() if hasattr(super(), '_get_session_info') else {}
        session_info['jalali_calendar_mode'] = self.env.user.jalali_calendar_mode or 'shamsi'
        session_info['jalali_use_persian_numbers'] = bool(self.env.user.jalali_use_persian_numbers)
        session_info['jalali_date_format'] = self.env.user.jalali_date_format or 'YYYY/MM/DD'
        return session_info

    @api.model
    def get_jalali_preferences(self, user_id=None):
        """Returns the user preferences for client-side bootstrapping."""
        user = self.browse(user_id) if user_id else self.env.user
        return {
            'mode': user.jalali_calendar_mode or 'shamsi',
            'date_format': user.jalali_date_format or 'YYYY/MM/DD',
            'use_persian_numbers': bool(user.jalali_use_persian_numbers),
        }


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        """Ensures session_info and user_context include Jalali user preferences at web client bootstrap in Odoo 20."""
        result = super().session_info()
        user = self.env.user
        mode = getattr(user, 'jalali_calendar_mode', 'shamsi') or 'shamsi'
        use_fa_num = bool(getattr(user, 'jalali_use_persian_numbers', False))
        date_fmt = getattr(user, 'jalali_date_format', 'YYYY/MM/DD') or 'YYYY/MM/DD'

        result['jalali_calendar_mode'] = mode
        result['jalali_use_persian_numbers'] = use_fa_num
        result['jalali_date_format'] = date_fmt

        # Also inject into user_context for direct access via user.context in OWL 3
        if 'user_context' in result and isinstance(result['user_context'], dict):
            result['user_context']['jalali_calendar_mode'] = mode
            result['user_context']['jalali_use_persian_numbers'] = use_fa_num
            result['user_context']['jalali_date_format'] = date_fmt

        return result
