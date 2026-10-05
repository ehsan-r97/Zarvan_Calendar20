# -*- coding: utf-8 -*-
"""
Company Extensions for Jalali Calendar - Odoo 20
Configures weekend patterns and fiscal year start month.
"""

from datetime import datetime, date
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class ResCompany(models.Model):
    _inherit = 'res.company'

    jalali_weekend_type = fields.Selection([
        ('friday', 'Friday Only'),
        ('thu_fri', 'Thursday & Friday'),
        ('custom', 'Custom Days'),
    ], string='Jalali Weekend Type', default='thu_fri')

    jalali_weekend_custom = fields.Char(
        string='Custom Weekend Days',
        help="Comma-separated Jalali weekday numbers (0=Sat to 6=Fri). Example: '5,6' or '0,1'"
    )

    fiscal_year_start_month = fields.Integer(
        string='Fiscal Year Start Jalali Month',
        default=1,
        help="Jalali month number (1=Farvardin, 7=Mehr, 10=Dey)"
    )

    def is_weekend(self, check_date=None, weekday=None, company_id=None):
        """
        Checks if a given date or weekday is a weekend for the specified company.
        Pure Python, timezone-safe & handles datetime string parsing properly.
        """
        if company_id:
            company = self.env['res.company'].browse(company_id)
            if not company.exists():
                raise UserError(_("Company not found."))
        else:
            company = self[0] if self else self.env.company

        if weekday is None:
            if not check_date:
                return False

            if isinstance(check_date, str):
                dt = datetime.strptime(check_date[:10], '%Y-%m-%d').date()
            elif isinstance(check_date, datetime):
                dt = check_date.date()
            elif isinstance(check_date, date):
                dt = check_date
            else:
                return False

            # Python weekday: 0=Monday ... 5=Saturday, 6=Sunday
            # Persian weekday: 0=Saturday (Shanbeh) ... 5=Thursday, 6=Friday (Jomeh)
            weekday = (dt.weekday() + 2) % 7

        if company.jalali_weekend_type == 'friday':
            return weekday == 6
        elif company.jalali_weekend_type == 'thu_fri':
            return weekday in (5, 6)
        elif company.jalali_weekend_type == 'custom' and company.jalali_weekend_custom:
            try:
                custom_days = [int(d.strip()) for d in company.jalali_weekend_custom.split(',') if d.strip()]
                return weekday in custom_days
            except ValueError:
                return False

        return False
