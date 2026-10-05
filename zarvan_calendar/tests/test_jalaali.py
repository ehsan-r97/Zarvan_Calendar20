# -*- coding: utf-8 -*-
"""
Automated Unit Tests for Zarvan Persian Calendar - Odoo 20
Run with: odoo-bin -d test_db --test-tags=zarvan_calendar --stop-after-init
"""

from datetime import date
from odoo.tests.common import TransactionCase, tagged
from odoo.exceptions import ValidationError


@tagged('post_install', '-at_install', 'zarvan_calendar')
class TestJalaaliCalendar(TransactionCase):

    def setUp(self):
        super().setUp()
        self.mixin = self.env['jalaali.mixin']
        self.service = self.env['jalaali.service']
        self.holiday_model = self.env['jalaali.holiday']
        self.company = self.env.company

    def test_01_date_conversions(self):
        """Test bidirectional conversion accuracy for Nowruz 1405."""
        # 1405-01-01 should map to 2026-03-21
        g_date = self.mixin.jalali_to_gregorian(1405, 1, 1)
        self.assertEqual(g_date, date(2026, 3, 21), "Nowruz 1405 must map to 2026-03-21")

        # Convert back
        j_date = self.mixin.gregorian_to_jalali(2026, 3, 21)
        self.assertEqual(j_date, (1405, 1, 1), "2026-03-21 must map back to (1405, 1, 1)")

    def test_02_detect_and_parse_date(self):
        """Test parsing Persian strings, formats, compact 8-digits, and Persian numerals."""
        # Standard format
        d1 = self.mixin.detect_and_parse_date("1405-01-01")
        self.assertEqual(d1, date(2026, 3, 21))

        # Persian digits format: ۱۴۰۵/۰۱/۰۱
        d2 = self.mixin.detect_and_parse_date("۱۴۰۵/۰۱/۰۱")
        self.assertEqual(d2, date(2026, 3, 21))

        # Unpadded single-digit month and day: 1405/1/1 and ۱۴۰۵/۱/۱
        d_unpadded = self.mixin.detect_and_parse_date("1405/1/1")
        self.assertEqual(d_unpadded, date(2026, 3, 21))

        d_unpadded_fa = self.mixin.detect_and_parse_date("۱۴۰۵/۱/۱")
        self.assertEqual(d_unpadded_fa, date(2026, 3, 21))

        # Compact 8-digit continuous format: 14050101 and 14050115
        d_compact = self.mixin.detect_and_parse_date("14050101")
        self.assertEqual(d_compact, date(2026, 3, 21))

        # DD-MM-YYYY format
        d3 = self.mixin.detect_and_parse_date("01-01-1405")
        self.assertEqual(d3, date(2026, 3, 21))

    def test_03_holiday_sql_constraints(self):
        """Test that lunar holidays across different years do NOT trigger constraint failure."""
        h1 = self.holiday_model.create({
            'name': 'عاشورا ۱۴۰۴',
            'jalali_year': 1404,
            'jalali_month': 6,
            'jalali_day': 17,
            'holiday_type': 'lunar',
        })
        self.assertTrue(h1.id)

        # Same month & day but different year: should SUCCEED now that constraint has jalali_year!
        h2 = self.holiday_model.create({
            'name': 'عاشورا ۱۴۰۵',
            'jalali_year': 1405,
            'jalali_month': 6,
            'jalali_day': 17,
            'holiday_type': 'lunar',
        })
        self.assertTrue(h2.id)

    def test_04_company_weekend_detection(self):
        """Test company weekend logic (Thursday-Friday vs Friday-only)."""
        # Configure company as Thursday-Friday
        self.company.jalali_weekend_type = 'thu_fri'
        # 5 is Panjshanbeh, 6 is Jomeh
        self.assertTrue(self.company.is_weekend(weekday=5))
        self.assertTrue(self.company.is_weekend(weekday=6))
        self.assertFalse(self.company.is_weekend(weekday=0))  # Shanbeh is not weekend

        # Configure company as Friday only
        self.company.jalali_weekend_type = 'friday'
        self.assertFalse(self.company.is_weekend(weekday=5))
        self.assertTrue(self.company.is_weekend(weekday=6))

    def test_05_working_days_calculation(self):
        """Test working days calculation in a month."""
        self.company.jalali_weekend_type = 'friday'
        result = self.service.get_working_days_in_month(1405, 1, company_id=self.company.id)

        self.assertEqual(result['total_days'], 31, "Farvardin must have 31 days")
        self.assertGreater(result['working_days'], 0)
        self.assertEqual(
            result['working_days'] + result['total_off_days'],
            result['total_days'],
            "Working days + off days must equal total days in month"
        )

    def test_06_search_domain_translation(self):
        """Test that search queries with Shamsi dates are translated to Gregorian."""
        # Querying with Shamsi date string
        domain = [('create_date', '>=', '1405-01-01 00:00:00')]
        converted = self.env['res.partner']._convert_jalali_domain(domain)
        # Should convert to 2026-03-21
        self.assertEqual(converted[0][2], '2026-03-21 00:00:00')

        # Persian digits in search: [('write_date', '<=', '۱۴۰۵/۰۱/۰۱')]
        domain_fa = [('write_date', '<=', '۱۴۰۵/۰۱/۰۱')]
        converted_fa = self.env['res.partner']._convert_jalali_domain(domain_fa)
        self.assertTrue(converted_fa[0][2].startswith('2026-03-21'))

    def test_07_user_calendar_modes(self):
        """Test user display mode configurations (shamsi, gregorian, both)."""
        user = self.env.user
        for mode in ('shamsi', 'gregorian', 'both'):
            user.jalali_calendar_mode = mode
            prefs = user.get_jalali_preferences()
            self.assertEqual(prefs['mode'], mode)

    def test_08_odoo20_security_groups(self):
        """Test Odoo security groups and category linkage."""
        user_group = self.env.ref('zarvan_calendar.group_jalaali_user')
        mgr_group = self.env.ref('zarvan_calendar.group_jalaali_manager')
        category = self.env.ref('zarvan_calendar.module_category_jalaali')
        self.assertEqual(user_group.category_id, category)
        self.assertEqual(mgr_group.category_id, category)
        self.assertIn(self.env.ref('base.user_admin'), mgr_group.users)

    def test_09_qweb_report_rendering(self):
        """Test ir.qweb.field.date rendering produces valid Persian date output."""
        qweb_date = self.env['ir.qweb.field.date']
        test_val = date(2026, 3, 21)
        self.env.user.jalali_calendar_mode = 'shamsi'
        html_out = qweb_date.value_to_html(test_val, {})
        self.assertIn('1405/01/01', html_out)

    def test_10_leap_year_astronomy(self):
        """Test leap year calculation for 1403 (leap), 1404 (non-leap), 1408 (leap)."""
        self.assertTrue(self.mixin.is_jalali_leap_year(1403), "1403 is a leap year")
        self.assertFalse(self.mixin.is_jalali_leap_year(1404), "1404 is NOT a leap year")
        self.assertFalse(self.mixin.is_jalali_leap_year(1405), "1405 is NOT a leap year")
        self.assertTrue(self.mixin.is_jalali_leap_year(1408), "1408 is a leap year")
        self.assertEqual(self.mixin.get_days_in_jalali_month(1403, 12), 30, "Esfand 1403 has 30 days")
        self.assertEqual(self.mixin.get_days_in_jalali_month(1404, 12), 29, "Esfand 1404 has 29 days")

    def test_11_duplicate_holiday_python_constraint(self):
        """Test that exact duplicate holiday raises ValidationError."""
        self.holiday_model.create({
            'name': 'تست یکتایی',
            'jalali_year': 1405,
            'jalali_month': 5,
            'jalali_day': 10,
            'holiday_type': 'fixed',
            'company_id': self.company.id,
        })
        with self.assertRaises(ValidationError):
            self.holiday_model.create({
                'name': 'تست تکرار',
                'jalali_year': 1405,
                'jalali_month': 5,
                'jalali_day': 10,
                'holiday_type': 'fixed',
                'company_id': self.company.id,
            })

    def test_12_pure_python_standalone_engine(self):
        """Test pure Python astronomical conversion parity without external libs."""
        from ..models.jalaali_mixin import _py_jalali_to_gregorian, _py_gregorian_to_jalali
        # Nowruz 1405

        g1 = _py_jalali_to_gregorian(1405, 1, 1)
        self.assertEqual(g1, date(2026, 3, 21))
        j1 = _py_gregorian_to_jalali(2026, 3, 21)
        self.assertEqual(j1, (1405, 1, 1))

        # Leap day: 1403/12/30 -> 2025-03-20
        g_leap = _py_jalali_to_gregorian(1403, 12, 30)
        self.assertEqual(g_leap, date(2025, 3, 20))
        j_leap = _py_gregorian_to_jalali(2025, 3, 20)
        self.assertEqual(j_leap, (1403, 12, 30))

    def test_13_ir_http_session_info(self):
        """Test that ir.http.session_info includes Jalali keys for zero-RPC bootstrap."""
        session_info = self.env['ir.http'].session_info()
        self.assertIn('jalali_calendar_mode', session_info)
        self.assertIn('jalali_use_persian_numbers', session_info)
        self.assertIn('jalali_date_format', session_info)
        # Check user_context injection for OWL 3 web client
        if 'user_context' in session_info:
            self.assertIn('jalali_calendar_mode', session_info['user_context'])
            self.assertIn('jalali_use_persian_numbers', session_info['user_context'])

    def test_14_timezone_aware_search_translation(self):
        """Test that search queries on datetime fields respect the user's timezone."""
        # Querying with Tehran user context (UTC+03:30)
        domain = [('create_date', '>=', '1405-01-01 00:00:00')]
        converted = self.env['res.partner'].with_context(tz='Asia/Tehran')._convert_jalali_domain(domain)
        # 1405-01-01 00:00:00 in Tehran is 2026-03-20 20:30:00 UTC
        self.assertIn('2026-03-20 20:30:00', converted[0][2])

    def test_15_enterprise_fiscal_year_and_periods(self):
        """Test Enterprise accounting fiscal year boundary and period ranges."""
        self.company.fiscal_year_start_month = 1
        g_start, g_end = self.company.get_jalali_fiscal_year_dates(1405)
        self.assertEqual(g_start, date(2026, 3, 21), "Fiscal year 1405 starts on 2026-03-21")
        self.assertEqual(g_end, date(2027, 3, 20), "Fiscal year 1405 ends on 2027-03-20")

        # Test Q1 period range
        q1 = self.service.get_jalali_period_date_range('quarter', 1405, 1)
        self.assertEqual(q1['start_date'], date(2026, 3, 21))
        self.assertEqual(q1['end_date'], date(2026, 6, 21))  # 1405/03/31 -> 2026-06-21

    def test_16_controller_endpoints(self):
        """Test that RESTful API controller routes are loaded and functioning."""
        from ..controllers.jalaali_api import JalaaliApiController
        controller = JalaaliApiController()

        self.assertTrue(hasattr(controller, 'api_current'))
        self.assertTrue(hasattr(controller, 'api_convert_g2j'))
        self.assertTrue(hasattr(controller, 'api_convert_j2g'))
        self.assertTrue(hasattr(controller, 'api_holidays'))
        self.assertTrue(hasattr(controller, 'api_working_days'))
        self.assertTrue(hasattr(controller, 'api_preferences'))

    def test_17_service_helpers(self):
        """Test JalaaliService helper methods and public mixin methods."""
        today_data = self.service.get_today_shamsi()
        self.assertIn('year', today_data)
        self.assertIn('formatted', today_data)

        # Test convert_g2j
        conv_g2j = self.service.convert_g2j(2026, 3, 21)
        self.assertEqual(conv_g2j['formatted'], '1405/01/01')

        # Test convert_j2g
        conv_j2g = self.service.convert_j2g(1405, 1, 1)
        self.assertEqual(conv_j2g['formatted'], '2026-03-21')

    def test_18_month_boundary_cron_helpers(self):
        """Test is_first_day_of_jalali_month and is_last_day_of_jalali_month for crons."""
        # Nowruz (1405/01/01) -> 2026-03-21
        self.assertTrue(self.service.is_first_day_of_jalali_month(date(2026, 3, 21)))
        self.assertFalse(self.service.is_first_day_of_jalali_month(date(2026, 3, 22)))

        # Last day of Farvardin 1405 (1405/01/31) -> 2026-04-20
        self.assertTrue(self.service.is_last_day_of_jalali_month(date(2026, 4, 20)))
        self.assertFalse(self.service.is_last_day_of_jalali_month(date(2026, 4, 19)))

    def test_19_proration_and_tax_days(self):
        """Test subscription monthly proration and tax days elapsed calculation."""
        res_pro = self.service.calculate_monthly_proration(1405, 1, 1, 3100.0)
        self.assertEqual(res_pro['total_days_in_month'], 31)
        self.assertEqual(res_pro['active_days'], 31)
        self.assertEqual(res_pro['prorated_amount'], 3100.0)

        # Start on day 16 (16 days remaining in a 31-day month)
        res_half = self.service.calculate_monthly_proration(1405, 1, 16, 3100.0)
        self.assertEqual(res_half['active_days'], 16)
        self.assertEqual(res_half['prorated_amount'], 1600.0)

        # Tax days elapsed
        days_nowruz = self.service.get_moodian_tax_date_days(date(2026, 3, 21))
        self.assertEqual(days_nowruz, 1)
        days_day2 = self.service.get_moodian_tax_date_days(date(2026, 3, 22))
        self.assertEqual(days_day2, 2)

    def test_20_enterprise_edge_helpers(self):
        """Test bank compact date, dual timestamp, withholding deadline and SSO days."""
        # 1. Bank Compact 8-digit date
        bank_d = self.service.get_bank_compact_date(date(2026, 3, 21))
        self.assertEqual(bank_d, '14050101')

        # 2. Dual timestamp format
        dt_test = datetime(2026, 3, 21, 8, 30, 0)
        dual_str = self.service.format_dual_timestamp(dt_test, user_tz='Asia/Tehran')
        self.assertIn('1405/01/01', dual_str)
        self.assertIn('2026-03-21', dual_str)
        self.assertIn('UTC', dual_str)

        # 3. Tax withholding deadline (next month's end)
        tax_res = self.service.get_tax_withholding_deadline(1405, 1)
        self.assertEqual(tax_res['jalali_deadline'], '1405/02/31')

        # 4. Social Security Organization (SSO) month days count
        self.assertEqual(self.service.get_sso_month_days(1405, 1), 31)
        self.assertEqual(self.service.get_sso_month_days(1405, 7), 30)

    def test_21_fiscal_closing_and_ean13(self):
        """Test fiscal closing localized boundary and EAN-13 check digit calculator."""
        # 1. EAN-13 check digit
        ean = self.service.calculate_ean13_checksum('626123456789')
        self.assertEqual(len(ean), 13)
        self.assertTrue(ean.startswith('626123456789'))

        # 2. Fiscal year 1404 closing timestamp (non-leap year, 29 Esfand)
        closing = self.service.get_fiscal_closing_timestamp(1404, user_tz='Asia/Tehran')
        self.assertIsNotNone(closing)
        self.assertEqual(closing['jalali_date'], '1404/12/29 23:59:59')
        self.assertIn('UTC', closing['utc_iso'])

    def test_22_shortcuts_aging_and_labor_law(self):
        """Test date macro shortcuts, Iranian aging buckets and Labor Law timesheet."""
        b_date = date(2026, 3, 21) # 1405/01/01

        # 1. Shortcuts
        t_res = self.service.parse_date_shortcut('t', b_date)
        self.assertEqual(t_res['jalali_date'], '1405/01/01')

        nw_res = self.service.parse_date_shortcut('nw', b_date)
        self.assertEqual(nw_res['jalali_date'], '1405/01/01')

        m_res = self.service.parse_date_shortcut('+1m', b_date)
        self.assertEqual(m_res['jalali_date'], '1405/02/01')

        end_res = self.service.parse_date_shortcut('end', b_date)
        self.assertEqual(end_res['jalali_date'], '1405/01/31')

        # 2. Aging buckets
        buckets = self.service.calculate_persian_aging_buckets(b_date)
        self.assertEqual(len(buckets), 5)
        self.assertEqual(buckets[0]['name'], 'ماه جاری')
        self.assertEqual(buckets[0]['jalali_month_name'], 'فروردین')
        self.assertEqual(buckets[0]['jalali_year'], 1405)
        self.assertEqual(buckets[1]['jalali_month_name'], 'اسفند')
        self.assertEqual(buckets[1]['jalali_year'], 1404)

        # 3. Labor law calculation (10 hours worked on a weekday, 2 night hours)
        timesheet = self.service.calculate_labor_law_timesheet(hours_worked=10.0, is_friday=False, night_hours=2.0)
        self.assertEqual(timesheet['worked_hours'], 10.0)
        self.assertEqual(timesheet['regular_hours'], 7.33)
        self.assertEqual(timesheet['overtime_hours'], 2.67)
        self.assertEqual(timesheet['night_hours'], 2.0)
        self.assertTrue(timesheet['total_effective_hours'] > 10.0)




