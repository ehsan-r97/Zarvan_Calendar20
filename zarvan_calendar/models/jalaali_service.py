# -*- coding: utf-8 -*-
"""
Service layer for Jalali calendar calculations and holiday checks - Odoo 19
"""

import logging
from datetime import date
from odoo import models, api

_logger = logging.getLogger(__name__)


class JalaaliService(models.AbstractModel):
    _name = 'jalaali.service'
    _description = 'Jalali Calendar Service Layer'

    @api.model
    def get_current_jalali_date(self):
        """Returns today's Jalali date dictionary without external library dependency."""
        today = date.today()
        mixin = self.env['jalaali.mixin']
        jy, jm, jd = mixin.gregorian_to_jalali(today.year, today.month, today.day)
        # Persian weekday: Shanbeh = 0, Jomeh = 6
        p_weekday = (today.weekday() + 2) % 7
        weekday_name = mixin.get_jalali_weekday_name(today.weekday())

        return {
            'year': jy,
            'month': jm,
            'day': jd,
            'weekday': p_weekday,
            'weekday_name': weekday_name,
            'formatted': f"{jy:04d}/{jm:02d}/{jd:02d}",
            'gregorian_date': today.strftime('%Y-%m-%d'),
        }

    @api.model
    def is_holiday(self, year, month, day, company_id=None):
        """Checks if a given Jalali date is an official holiday or company weekend."""
        company = self.env['res.company'].browse(company_id) if company_id else self.env.company
        if not company.exists():
            company = self.env.company

        mixin = self.env['jalaali.mixin']
        g_date = mixin.jalali_to_gregorian(year, month, day)
        if not g_date:
            return {'is_holiday': False, 'is_official_holiday': False, 'is_weekend': False}

        # 1. Check weekend
        p_weekday = (g_date.weekday() + 2) % 7
        is_weekend = company.is_weekend(weekday=p_weekday, company_id=company.id)

        # 2. Check official holiday records
        holiday_model = self.env['jalaali.holiday']
        domain = [
            ('jalali_month', '=', month),
            ('jalali_day', '=', day),
            ('active', '=', True),
            '|',
            ('company_id', '=', False),
            ('company_id', '=', company.id),
            '|',
            ('jalali_year', '=', False),
            ('jalali_year', '=', year),
        ]
        holiday = holiday_model.search(domain, limit=1)

        is_official = bool(holiday)
        is_off = is_weekend or is_official

        return {
            'is_holiday': is_off,
            'is_official_holiday': is_official,
            'is_weekend': is_weekend,
            'holiday_name': holiday.name if holiday else ('Weekend' if is_weekend else None),
            'holiday_type': holiday.holiday_type if holiday else ('weekend' if is_weekend else None),
            'is_national': holiday.is_national if holiday else False,
            'weekday': p_weekday,
        }

    @api.model
    def get_holidays_in_year(self, year, company_id=None):
        """Returns list of all active holidays for a given Jalali year."""
        company = self.env['res.company'].browse(company_id) if company_id else self.env.company
        if not company.exists():
            company = self.env.company

        holiday_model = self.env['jalaali.holiday']
        domain = [
            ('active', '=', True),
            '|',
            ('company_id', '=', False),
            ('company_id', '=', company.id),
            '|',
            ('jalali_year', '=', False),
            ('jalali_year', '=', year),
        ]
        holidays = holiday_model.search(domain)

        result = []
        for h in holidays:
            result.append({
                'id': h.id,
                'name': h.name,
                'year': h.jalali_year or year,
                'month': h.jalali_month,
                'day': h.jalali_day,
                'holiday_type': h.holiday_type,
                'is_national': h.is_national,
                'description': h.description or '',
                'company_id': h.company_id.id if h.company_id else False,
            })
        return result

    @api.model
    def get_working_days_in_month(self, year, month, company_id=None):
        """Calculates working days, weekends, and holidays in a Jalali month without external libs."""
        company = self.env['res.company'].browse(company_id) if company_id else self.env.company
        if not company.exists():
            company = self.env.company

        mixin = self.env['jalaali.mixin']
        days_in_month = mixin.get_days_in_jalali_month(year, month)

        holiday_model = self.env['jalaali.holiday']
        domain = [
            ('jalali_month', '=', month),
            ('active', '=', True),
            '|',
            ('company_id', '=', False),
            ('company_id', '=', company.id),
            '|',
            ('jalali_year', '=', False),
            ('jalali_year', '=', year),
        ]
        month_holidays = holiday_model.search(domain)
        holiday_days = set(month_holidays.mapped('jalali_day'))

        working_days = 0
        weekend_days = 0
        non_weekend_holidays = 0

        for day in range(1, days_in_month + 1):
            g_date = mixin.jalali_to_gregorian(year, month, day)
            if not g_date:
                continue
            p_weekday = (g_date.weekday() + 2) % 7
            is_weekend = company.is_weekend(weekday=p_weekday, company_id=company.id)
            is_holiday_day = day in holiday_days

            if is_weekend:
                weekend_days += 1
            elif is_holiday_day:
                non_weekend_holidays += 1
            else:
                working_days += 1

        return {
            'year': year,
            'month': month,
            'total_days': days_in_month,
            'working_days': working_days,
            'weekend_days': weekend_days,
            'holiday_days': non_weekend_holidays,
            'total_off_days': weekend_days + non_weekend_holidays,
            'company_id': company.id,
        }
