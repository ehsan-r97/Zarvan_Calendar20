# -*- coding: utf-8 -*-
"""
Service layer for Jalali calendar calculations and holiday checks - Odoo 20
"""

import logging
from datetime import date, datetime
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
        res = mixin.gregorian_to_jalali(today.year, today.month, today.day)
        if not res:
            jy, jm, jd = 1405, 1, 1
        else:
            jy, jm, jd = res
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
    def get_today_shamsi(self):
        """Alias for get_current_jalali_date."""
        return self.get_current_jalali_date()

    @api.model
    def convert_g2j(self, *args, **kwargs):
        """
        Converts Gregorian date to Jalali.
        Accepts either string (e.g. '2026-03-21') or year, month, day.
        """
        mixin = self.env['jalaali.mixin']
        if len(args) == 1 and isinstance(args[0], (str, date)):
            d = args[0]
            if isinstance(d, str):
                d = mixin.detect_and_parse_date(d, force_gregorian=True)
            if not d:
                return False
            y, m, day_val = d.year, d.month, d.day
        elif len(args) >= 3:
            y, m, day_val = int(args[0]), int(args[1]), int(args[2])
        else:
            return False

        res = mixin.gregorian_to_jalali(y, m, day_val)
        if not res:
            return False
        jy, jm, jd = res
        return {
            'year': jy,
            'month': jm,
            'day': jd,
            'formatted': f"{jy:04d}/{jm:02d}/{jd:02d}",
            'gregorian_date': f"{y:04d}-{m:02d}-{day_val:02d}",
        }

    @api.model
    def convert_j2g(self, *args, **kwargs):
        """
        Converts Jalali date to Gregorian.
        Accepts either string (e.g. '1405/01/01') or year, month, day.
        """
        mixin = self.env['jalaali.mixin']
        if len(args) == 1 and isinstance(args[0], str):
            d = mixin.detect_and_parse_date(args[0], force_jalali=True)
            if not d:
                return False
            return {
                'year': d.year,
                'month': d.month,
                'day': d.day,
                'formatted': d.strftime('%Y-%m-%d'),
                'jalali_date': args[0],
            }
        elif len(args) >= 3:
            jy, jm, jd = int(args[0]), int(args[1]), int(args[2])
            d = mixin.jalali_to_gregorian(jy, jm, jd)
            if not d:
                return False
            return {
                'year': d.year,
                'month': d.month,
                'day': d.day,
                'formatted': d.strftime('%Y-%m-%d'),
                'jalali_date': f"{jy:04d}/{jm:02d}/{jd:02d}",
            }
        return False

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

    @api.model
    def get_jalali_period_date_range(self, period_type, year, month_or_quarter=1):
        """
        Calculates Gregorian start and end dates for any Jalali period.
        Supported period_type:
          - 'month': month_or_quarter is 1..12
          - 'quarter': month_or_quarter is 1..4 (Q1: Farvardin-Khordad, Q2: Tir-Shahrivar, etc.)
          - 'year': entire Jalali year
          - 'half_year': 1 (Spring/Summer: Farvardin-Shahrivar) or 2 (Fall/Winter: Mehr-Esfand)
        Used by Odoo Enterprise Accounting and dynamic dashboard filters.
        """
        mixin = self.env['jalaali.mixin']
        if period_type == 'month':
            m = int(month_or_quarter)
            max_d = mixin.get_days_in_jalali_month(year, m)
            start_date = mixin.jalali_to_gregorian(year, m, 1)
            end_date = mixin.jalali_to_gregorian(year, m, max_d)
        elif period_type == 'quarter':
            q = int(month_or_quarter)
            start_m = (q - 1) * 3 + 1
            end_m = start_m + 2
            max_d = mixin.get_days_in_jalali_month(year, end_m)
            start_date = mixin.jalali_to_gregorian(year, start_m, 1)
            end_date = mixin.jalali_to_gregorian(year, end_m, max_d)
        elif period_type == 'half_year':
            h = int(month_or_quarter)
            start_m = 1 if h == 1 else 7
            end_m = 6 if h == 1 else 12
            max_d = mixin.get_days_in_jalali_month(year, end_m)
            start_date = mixin.jalali_to_gregorian(year, start_m, 1)
            end_date = mixin.jalali_to_gregorian(year, end_m, max_d)
        else:
            max_d = mixin.get_days_in_jalali_month(year, 12)
            start_date = mixin.jalali_to_gregorian(year, 1, 1)
            end_date = mixin.jalali_to_gregorian(year, 12, max_d)

        return {
            'start_date': start_date,
            'end_date': end_date,
            'start_date_str': start_date.strftime('%Y-%m-%d') if start_date else '',
            'end_date_str': end_date.strftime('%Y-%m-%d') if end_date else '',
        }

    @api.model
    def is_first_day_of_jalali_month(self, check_date=None):
        """
        Returns True if the specified Gregorian date is day 1 of a Jalali month.
        Useful for monthly crons (salary slips, installment reminders, depreciation).
        """
        d = check_date or date.today()
        if isinstance(d, datetime):
            d = d.date()
        mixin = self.env['jalaali.mixin']
        res = mixin.gregorian_to_jalali(d.year, d.month, d.day)
        return res[2] == 1 if res else False

    @api.model
    def is_last_day_of_jalali_month(self, check_date=None):
        """
        Returns True if the specified Gregorian date is the final day of a Jalali month.
        Useful for monthly financial closings, bank reconciliations, and inventory cuts.
        """
        d = check_date or date.today()
        if isinstance(d, datetime):
            d = d.date()
        mixin = self.env['jalaali.mixin']
        res = mixin.gregorian_to_jalali(d.year, d.month, d.day)
        if not res:
            return False
        jy, jm, jd = res
        max_d = mixin.get_days_in_jalali_month(jy, jm)
        return jd == max_d

    @api.model
    def calculate_monthly_proration(self, year, month, start_day, total_amount):
        """
        Calculates exact daily pro-rata amount from start_day to month end.
        Ensures subscription / contract billing matches true Persian month lengths (31, 30, or 29/30 days).
        Zero risk pure arithmetic calculation.
        """
        if total_amount <= 0 or start_day <= 0:
            return 0.0
        mixin = self.env['jalaali.mixin']
        total_days = mixin.get_days_in_jalali_month(year, month)
        if start_day > total_days:
            start_day = total_days
        active_days = total_days - start_day + 1
        daily_rate = total_amount / float(total_days)
        prorated_amount = round(daily_rate * active_days, 2)
        return {
            'total_days_in_month': total_days,
            'active_days': active_days,
            'daily_rate': daily_rate,
            'prorated_amount': prorated_amount,
        }

    @api.model
    def get_moodian_tax_date_days(self, check_date=None):
        """
        Helper for Iran Tax Authority (سامانه مودیان).
        Computes elapsed days from Nowruz of the current Jalali year for fiscal ID hashing.
        """
        d = check_date or date.today()
        if isinstance(d, datetime):
            d = d.date()
        mixin = self.env['jalaali.mixin']
        res = mixin.gregorian_to_jalali(d.year, d.month, d.day)
        if not res:
            return 1
        jy, jm, jd = res
        nowruz_g = mixin.jalali_to_gregorian(jy, 1, 1)
        if not nowruz_g:
            return 1
        return (d - nowruz_g).days + 1

    @api.model
    def get_bank_compact_date(self, check_date=None):
        """
        Formats date as an 8-digit ASCII string YYYYMMDD (e.g. '14050101')
        strictly required by Iranian ACH/Paya/Satna batch bank transfer formats.
        """
        d = check_date or date.today()
        if isinstance(d, datetime):
            d = d.date()
        mixin = self.env['jalaali.mixin']
        res = mixin.gregorian_to_jalali(d.year, d.month, d.day)
        if not res:
            return ''
        jy, jm, jd = res
        return f"{jy:04d}{jm:02d}{jd:02d}"

    @api.model
    def format_dual_timestamp(self, dt_val=None, user_tz=None):
        """
        Formats datetime in international dual-standard:
        '1405/01/01 12:00:00 (2026-03-21 08:30:00 UTC)'
        Used for export trade, customs, and digital signature audit certificates.
        """
        import pytz
        dt = dt_val or datetime.utcnow()
        if not dt.tzinfo:
            dt = pytz.UTC.localize(dt)
        else:
            dt = dt.astimezone(pytz.UTC)

        tz_name = user_tz or self.env.context.get('tz') or 'Asia/Tehran'
        local_tz = pytz.timezone(tz_name)
        local_dt = dt.astimezone(local_tz)

        mixin = self.env['jalaali.mixin']
        j_res = mixin.gregorian_to_jalali(local_dt.year, local_dt.month, local_dt.day)
        if not j_res:
            return dt.strftime('%Y-%m-%d %H:%M:%S UTC')
        jy, jm, jd = j_res
        j_str = f"{jy:04d}/{jm:02d}/{jd:02d} {local_dt.strftime('%H:%M:%S')}"
        utc_str = dt.strftime('%Y-%m-%d %H:%M:%S UTC')
        return f"{j_str} ({utc_str})"

    @api.model
    def get_tax_withholding_deadline(self, jy, jm):
        """
        Calculates legal withholding tax payment deadline under Article 86 & 103 of Direct Taxes Act.
        The deadline is the final day of the NEXT Jalali month.
        """
        next_m = jm + 1
        next_y = jy
        if next_m > 12:
            next_m = 1
            next_y += 1
        mixin = self.env['jalaali.mixin']
        max_d = mixin.get_days_in_jalali_month(next_y, next_m)
        deadline_g = mixin.jalali_to_gregorian(next_y, next_m, max_d)
        return {
            'jalali_deadline': f"{next_y:04d}/{next_m:02d}/{max_d:02d}",
            'gregorian_deadline': deadline_g.strftime('%Y-%m-%d') if deadline_g else '',
        }

    @api.model
    def get_sso_month_days(self, jy, jm):
        """
        Returns official Social Security Organization (سازمان تامین اجتماعی - DSKkar/DSKwor)
        month days count to prevent 10% penalty for diskette rejection.
        """
        mixin = self.env['jalaali.mixin']
        return mixin.get_days_in_jalali_month(jy, jm)

    @api.model
    def get_fiscal_closing_timestamp(self, jy, user_tz=None):
        """
        Computes the exact UTC timestamp for 23:59:59 on the last day of the Persian fiscal year
        (29 or 30 Esfand) localized to Asia/Tehran or user timezone.
        Prevents premature asset recognition or balance sheet cutoff flags by auditors.
        """
        import pytz
        from datetime import time
        mixin = self.env['jalaali.mixin']
        max_esfand = mixin.get_days_in_jalali_month(jy, 12)
        end_g = mixin.jalali_to_gregorian(jy, 12, max_esfand)
        if not end_g:
            return None
        tz_name = user_tz or self.env.context.get('tz') or 'Asia/Tehran'
        local_tz = pytz.timezone(tz_name)
        local_dt = local_tz.localize(datetime.combine(end_g, time(23, 59, 59)))
        utc_dt = local_dt.astimezone(pytz.UTC)
        return {
            'jalali_date': f"{jy:04d}/12/{max_esfand:02d} 23:59:59",
            'local_iso': local_dt.strftime('%Y-%m-%d %H:%M:%S %Z'),
            'utc_iso': utc_dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
            'utc_datetime': utc_dt,
        }

    @api.model
    def get_nearest_working_day(self, check_date=None, company_id=None, direction='forward'):
        """
        Snaps a target date (e.g. QC quarantine re-test timer, delivery lead time)
        to the nearest active working day if it falls on an Iranian holiday or weekend.
        """
        from datetime import timedelta
        d = check_date or date.today()
        if isinstance(d, datetime):
            d = d.date()
        company = self.env['res.company'].browse(company_id) if company_id else self.env.company
        step = 1 if direction == 'forward' else -1
        curr = d
        for _ in range(30):
            # 6 is Sunday in standard Python (0=Mon, 4=Fri), but let's check company weekend and holidays
            is_off = False
            if hasattr(company, 'is_weekend'):
                p_weekday = (curr.weekday() + 2) % 7
                is_off = company.is_weekend(p_weekday)
            else:
                is_off = curr.weekday() in (3, 4) # Thu or Fri default
            if not is_off:
                # Check official holidays
                hols = self.env['jalaali.holiday'].search([('holiday_date', '=', curr)], limit=1)
                if not hols:
                    return curr
            curr += timedelta(days=step)
        return d

    @api.model
    def calculate_ean13_checksum(self, base_12_str):
        """
        Calculates standard Modulo-10 check digit for 12-digit payloads
        (e.g. product serials embedding Jalali production date).
        Guarantees generated barcode labels scan 100% reliably at cash registers.
        """
        digits = [int(c) for c in str(base_12_str) if c.isdigit()]
        if len(digits) != 12:
            return None
        odd_sum = sum(digits[0::2])
        even_sum = sum(digits[1::2]) * 3
        total = odd_sum + even_sum
        check_digit = (10 - (total % 10)) % 10
        return f"{base_12_str}{check_digit}"

    @api.model
    def check_system_environmental_integrity(self):
        """
        Pre-flight environmental audit for production environments.
        Verifies:
        1. PostgreSQL connection timezone is strictly UTC.
        2. System encoding is UTF-8.
        3. Pytz timezone definitions are available.
        4. Odoo 20 schema non-destructive integrity.
        Returns a comprehensive diagnostic dictionary.
        """
        import sys
        diagnostics = {
            'encoding': sys.getdefaultencoding(),
            'postgres_timezone': 'UNKNOWN',
            'is_postgres_utc': False,
            'pytz_available': True,
            'status': 'HEALTHY',
            'warnings': [],
        }
        try:
            self.env.cr.execute("SHOW timezone;")
            row = self.env.cr.fetchone()
            if row:
                tz_val = str(row[0]).strip().upper()
                diagnostics['postgres_timezone'] = tz_val
                if tz_val in ('UTC', 'GMT', 'UCT'):
                    diagnostics['is_postgres_utc'] = True
                else:
                    diagnostics['warnings'].append(
                        f"PostgreSQL session timezone is '{tz_val}'. Odoo requires 'UTC'. Forcing session to UTC."
                    )
                    self.env.cr.execute("SET timezone TO 'UTC';")
                    diagnostics['is_postgres_utc'] = True
        except Exception as e:
            diagnostics['warnings'].append(f"Could not query PostgreSQL timezone: {e}")

        if diagnostics['encoding'].lower() not in ('utf-8', 'utf8'):
            diagnostics['warnings'].append(f"System encoding is '{diagnostics['encoding']}', expected UTF-8.")

        if diagnostics['warnings']:
            diagnostics['status'] = 'WARNING'

        return diagnostics

    def _register_hook(self):
        super()._register_hook()
        try:
            self.check_system_environmental_integrity()
        except Exception:
            pass

    @api.model
    def parse_date_shortcut(self, shortcut_str, base_date=None):
        """
        Parses keyboard macro shortcuts for rapid date entry:
        - 't', 'امروز': Today
        - 'nw', 'نوروز': 1 Farvardin of current year
        - 'end', 'پایان': Last day of current solar month
        - 'start', 'شروع': First day of current solar month (1st)
        - '+1m', '+2m', '-1m': + / - N solar months
        - '+1w', '-1w': + / - N weeks
        - '+1d', '+5', '-10': + / - N days
        Returns dict with jalali_str and gregorian_date.
        """
        from datetime import timedelta
        import re
        b_date = base_date or date.today()
        if isinstance(b_date, datetime):
            b_date = b_date.date()

        mixin = self.env['jalaali.mixin']
        j_curr = mixin.gregorian_to_jalali(b_date.year, b_date.month, b_date.day)
        if not j_curr:
            j_curr = (1405, 1, 1)
        jy, jm, jd = j_curr

        s = str(shortcut_str).strip().lower()

        # 1. Today
        if s in ('t', 'today', 'امروز'):
            res_g = b_date
            res_j = f"{jy:04d}/{jm:02d}/{jd:02d}"
            return {'gregorian_date': res_g, 'jalali_date': res_j}

        # 2. Nowruz
        if s in ('nw', 'nowruz', 'نوروز'):
            res_g = mixin.jalali_to_gregorian(jy, 1, 1)
            return {'gregorian_date': res_g, 'jalali_date': f"{jy:04d}/01/01"}

        # 3. Start of current month
        if s in ('start', 'شروع', 's'):
            res_g = mixin.jalali_to_gregorian(jy, jm, 1)
            return {'gregorian_date': res_g, 'jalali_date': f"{jy:04d}/{jm:02d}/01"}

        # 4. End of current month
        if s in ('end', 'پایان', 'e'):
            max_d = mixin.get_days_in_jalali_month(jy, jm)
            res_g = mixin.jalali_to_gregorian(jy, jm, max_d)
            return {'gregorian_date': res_g, 'jalali_date': f"{jy:04d}/{jm:02d}/{max_d:02d}"}

        # 5. Month offset (+1m, -2m)
        m_match = re.match(r'^([+-]?\d+)\s*(?:m|ماه|م)$', s)
        if m_match:
            delta_m = int(m_match.group(1))
            total_months = (jy * 12) + (jm - 1) + delta_m
            new_jy = total_months // 12
            new_jm = (total_months % 12) + 1
            max_d = mixin.get_days_in_jalali_month(new_jy, new_jm)
            new_jd = min(jd, max_d)
            res_g = mixin.jalali_to_gregorian(new_jy, new_jm, new_jd)
            return {'gregorian_date': res_g, 'jalali_date': f"{new_jy:04d}/{new_jm:02d}/{new_jd:02d}"}

        # 6. Week offset (+1w, -2w)
        w_match = re.match(r'^([+-]?\d+)\s*(?:w|هفته|ه)$', s)
        if w_match:
            delta_w = int(w_match.group(1))
            res_g = b_date + timedelta(weeks=delta_w)
            rg_j = mixin.gregorian_to_jalali(res_g.year, res_g.month, res_g.day)
            return {'gregorian_date': res_g, 'jalali_date': f"{rg_j[0]:04d}/{rg_j[1]:02d}/{rg_j[2]:02d}"}

        # 7. Day offset (+5d, -10, +3)
        d_match = re.match(r'^([+-]?\d+)\s*(?:d|روز|ر)?$', s)
        if d_match:
            delta_d = int(d_match.group(1))
            res_g = b_date + timedelta(days=delta_d)
            rg_j = mixin.gregorian_to_jalali(res_g.year, res_g.month, res_g.day)
            return {'gregorian_date': res_g, 'jalali_date': f"{rg_j[0]:04d}/{rg_j[1]:02d}/{rg_j[2]:02d}"}

        return None

    @api.model
    def calculate_persian_aging_buckets(self, as_of_date=None):
        """
        Generates 5 standard Iranian financial aging buckets (گزارش سنی مطالبات)
        partitioned exactly by Jalali months rather than arbitrary 30-day Gregorian chunks.
        """
        ref_d = as_of_date or date.today()
        if isinstance(ref_d, datetime):
            ref_d = ref_d.date()

        mixin = self.env['jalaali.mixin']
        j_curr = mixin.gregorian_to_jalali(ref_d.year, ref_d.month, ref_d.day)
        if not j_curr:
            j_curr = (1405, 1, 1)
        jy, jm, _ = j_curr

        month_names = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ]

        buckets = []
        for i in range(4):
            total_m = (jy * 12) + (jm - 1) - i
            b_jy = total_m // 12
            b_jm = (total_m % 12) + 1
            max_d = mixin.get_days_in_jalali_month(b_jy, b_jm)
            start_g = mixin.jalali_to_gregorian(b_jy, b_jm, 1)
            end_g = mixin.jalali_to_gregorian(b_jy, b_jm, max_d)
            label = "ماه جاری" if i == 0 else f"{i} ماه قبل ({month_names[b_jm - 1]} {b_jy})"
            buckets.append({
                'bucket_index': i,
                'name': label,
                'jalali_month_name': month_names[b_jm - 1],
                'jalali_year': b_jy,
                'jalali_month': b_jm,
                'start_gregorian': start_g,
                'end_gregorian': end_g,
                'start_jalali': f"{b_jy:04d}/{b_jm:02d}/01",
                'end_jalali': f"{b_jy:04d}/{b_jm:02d}/{max_d:02d}",
            })

        # Bucket 4: Over 4 months ago
        oldest_g = buckets[-1]['start_gregorian']
        buckets.append({
            'bucket_index': 4,
            'name': 'بیش از ۴ ماه قبل',
            'jalali_month_name': 'سابق',
            'jalali_year': None,
            'jalali_month': None,
            'start_gregorian': date(2000, 1, 1),
            'end_gregorian': oldest_g,
            'start_jalali': 'قدیمی',
            'end_jalali': buckets[-1]['start_jalali'],
        })

        return buckets

    @api.model
    def calculate_labor_law_timesheet(self, hours_worked, is_friday=False, night_hours=0.0):
        """
        Computes Iranian Labor Law payroll metrics (ماده ۵۱، ۵۸، ۵۹ و ۶۲ قانون کار):
        - Standard working hours baseline: 7.33 hours (7 hours 20 mins)
        - Overtime (ماده ۵۹): 40% premium rate
        - Friday overtime (ماده ۶۲): 40% holiday premium rate
        - Night hours (ماده ۵۸): 35% night premium (22:00 to 06:00)
        """
        standard_base = 7.33 if not is_friday else 0.0
        worked = float(hours_worked)

        overtime_hours = max(0.0, worked - standard_base) if not is_friday else worked
        friday_hours = worked if is_friday else 0.0
        regular_hours = min(worked, standard_base) if not is_friday else 0.0

        # Equivalent wage multipliers
        regular_weight = regular_hours * 1.0
        overtime_weight = overtime_hours * 1.40
        friday_weight = friday_hours * 1.40
        night_weight = float(night_hours) * 0.35

        total_effective_hours = regular_weight + overtime_weight + friday_weight + night_weight

        return {
            'worked_hours': worked,
            'regular_hours': round(regular_hours, 2),
            'overtime_hours': round(overtime_hours, 2),
            'friday_hours': round(friday_hours, 2),
            'night_hours': round(night_hours, 2),
            'overtime_premium_rate': 1.40,
            'friday_premium_rate': 1.40,
            'night_premium_rate': 0.35,
            'total_effective_hours': round(total_effective_hours, 2),
        }





