# -*- coding: utf-8 -*-
"""
Automated Unit Tests for Zarvan Persian Calendar - Odoo 19
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

    def test_08_odoo20_security_privilege_model(self):
        """Test Odoo 19/20 privilege model and group linkage."""
        privilege_model = self.env.get('res.groups.privilege')
        if privilege_model:
            privilege = self.env.ref('zarvan_calendar.privilege_jalaali_access', raise_if_not_found=False)
            self.assertTrue(privilege, "Persian Calendar Privilege must exist in Odoo 19/20")
            user_group = self.env.ref('zarvan_calendar.group_jalaali_user')
            mgr_group = self.env.ref('zarvan_calendar.group_jalaali_manager')
            self.assertEqual(user_group.privilege_id, privilege)
            self.assertEqual(mgr_group.privilege_id, privilege)
            self.assertIn(self.env.ref('base.user_admin'), mgr_group.user_ids)

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
        from zarvan_calendar.models.jalaali_mixin import _py_jalali_to_gregorian, _py_gregorian_to_jalali
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

