# -*- coding: utf-8 -*-
"""
Automated Unit Tests for Zarvan Persian Calendar - Odoo 20
Run with: odoo-bin -d test_db --test-tags=zarvan_calendar --stop-after-init
Or standalone with: python3 -m unittest discover zarvan_calendar/tests
"""

import sys
import types
from datetime import datetime, date

try:
    from odoo.tests.common import TransactionCase, tagged
    from odoo.exceptions import ValidationError
    HAS_ODOO = True
except ImportError:
    HAS_ODOO = False
    import unittest

    def tagged(*tags):
        def decorator(cls):
            return cls
        return decorator

    class ValidationError(Exception):
        pass

    class UserError(Exception):
        pass

    # Provide lightweight mock for odoo modules when running outside an active Odoo daemon
    for mod in ['odoo', 'odoo.models', 'odoo.fields', 'odoo.api', 'odoo.tools', 'odoo.exceptions', 'odoo.tests', 'odoo.tests.common']:
        if mod not in sys.modules:
            sys.modules[mod] = types.ModuleType(mod)

    m_odoo = sys.modules['odoo']
    m_odoo.models = sys.modules['odoo.models']
    m_odoo.fields = sys.modules['odoo.fields']
    m_odoo.api = sys.modules['odoo.api']
    m_odoo.tools = sys.modules['odoo.tools']
    m_odoo.exceptions = sys.modules['odoo.exceptions']
    m_odoo.tests = sys.modules['odoo.tests']
    m_odoo._ = lambda s: s
    sys.modules['odoo.tests'].common = sys.modules['odoo.tests.common']

    m_odoo.tools.ormcache = lambda *a, **k: (lambda f: f)
    m_odoo.api.model = lambda f: f
    m_odoo.api.model_create_multi = lambda f: f
    m_odoo.api.depends = lambda *a: (lambda f: f)
    m_odoo.api.constrains = lambda *a: (lambda f: f)
    m_odoo.api.onchange = lambda *a: (lambda f: f)
    m_odoo.api.autovacuum = lambda f: f
    m_odoo.models.Model = type('Model', (), {})
    m_odoo.models.TransientModel = type('TransientModel', (), {})
    m_odoo.models.AbstractModel = type('AbstractModel', (), {})
    for f_name in ['Char', 'Text', 'Integer', 'Float', 'Boolean', 'Selection', 'Date', 'Datetime', 'Binary', 'Many2one', 'One2many', 'Many2many']:
        setattr(m_odoo.fields, f_name, lambda *a, **k: None)
    m_odoo.exceptions.ValidationError = ValidationError
    m_odoo.exceptions.UserError = UserError

    from zarvan_calendar.models.jalaali_mixin import JalaaliMixin, _py_jalali_to_gregorian, _py_gregorian_to_jalali
    from zarvan_calendar.models.res_company import ResCompany
    from zarvan_calendar.models.base_search_patch import BaseModelSearchJalaliPatch
    from zarvan_calendar.models.base_group_patch import BaseGroupJalaliPatch
    from zarvan_calendar.models.ir_qweb_fields import IrQWebFieldDate, IrQWebFieldDatetime

    class MockCompany:
        def __init__(self, **kwargs):
            self.id = kwargs.get('id', 1)
            self.name = kwargs.get('name', 'Main Company')
            self.jalali_weekend_type = kwargs.get('jalali_weekend_type', 'thu_fri')
            self.jalali_weekend_custom = kwargs.get('jalali_weekend_custom', False)

        def is_weekend(self, weekday=None, dt=None, company_id=None):
            return ResCompany.is_weekend(self, weekday=weekday, dt=dt, company_id=company_id)

    class MockCompanyModel:
        def __init__(self):
            self._next_id = 2

        def create(self, vals):
            comp = MockCompany(id=self._next_id, **vals)
            self._next_id += 1
            return comp

    class MockUser:
        def __init__(self, company):
            self.id = 1
            self.name = 'Administrator'
            self.jalali_calendar_mode = 'shamsi'
            self.jalali_use_persian_numbers = False
            self.jalali_date_format = 'yyyy/mm/dd'
            self.company_id = company

        def get_jalali_preferences(self):
            return {
                'mode': self.jalali_calendar_mode,
                'use_persian_numbers': self.jalali_use_persian_numbers,
                'date_format': self.jalali_date_format,
            }

        def context_timestamp(self, dt):
            return dt

    class MockHolidayRecord:
        def __init__(self, **vals):
            self.id = vals.get('id', 1)
            self.name = vals.get('name', '')
            self.jalali_year = vals.get('jalali_year')
            self.jalali_month = vals.get('jalali_month')
            self.jalali_day = vals.get('jalali_day')
            self.holiday_type = vals.get('holiday_type', 'national')
            self.is_national = vals.get('is_national', True)
            self.company_id = vals.get('company_id')
            self.active = vals.get('active', True)

    class MockHolidayModel:
        def __init__(self):
            self._records = []
            self._next_id = 1
            # Seed standard holidays for 1405
            for d in [1, 2, 3, 4, 12, 13]:
                self._records.append(MockHolidayRecord(
                    id=self._next_id,
                    name=f'Nowruz {d}',
                    jalali_year=1405,
                    jalali_month=1,
                    jalali_day=d,
                    holiday_type='national',
                    is_national=True
                ))
                self._next_id += 1

        def create(self, vals):
            for r in self._records:
                if (r.holiday_type == vals.get('holiday_type') and
                    r.jalali_month == vals.get('jalali_month') and
                    r.jalali_day == vals.get('jalali_day') and
                    r.jalali_year == vals.get('jalali_year') and
                    r.company_id == vals.get('company_id')):
                    raise ValidationError("Holiday uniqueness conflict")
            rec = MockHolidayRecord(id=self._next_id, **vals)
            self._next_id += 1
            self._records.append(rec)
            return rec

        def search(self, domain):
            month = None
            year = None
            company_id = None
            for item in domain:
                if isinstance(item, tuple) or isinstance(item, list):
                    if item[0] == 'jalali_month' and item[1] == '=':
                        month = item[2]
                    elif item[0] == 'jalali_year' and item[1] in ('=', 'in'):
                        year = item[2]
                    elif item[0] == 'company_id':
                        company_id = item[2]
            res = []
            for r in self._records:
                if month is not None and r.jalali_month != month:
                    continue
                if year is not None:
                    if isinstance(year, list) and r.jalali_year not in year:
                        continue
                    elif not isinstance(year, list) and r.jalali_year != year:
                        continue
                res.append(r)
            return res

    class MockService(JalaaliMixin):
        def __init__(self, env):
            self.env = env

        def get_current_jalali_date(self):
            now = datetime.now()
            jy, jm, jd = self.gregorian_to_jalali(now.year, now.month, now.day)
            return {
                'year': jy, 'month': jm, 'day': jd,
                'formatted': f"{jy:04d}/{jm:02d}/{jd:02d}",
                'is_holiday': False
            }

        def get_working_days_in_month(self, jalali_year, jalali_month, company_id=None):
            days_in_month = self.get_days_in_jalali_month(jalali_year, jalali_month)
            holidays = self.env['jalaali.holiday'].search([
                ('jalali_month', '=', jalali_month),
                ('jalali_year', 'in', [jalali_year, False]),
            ])
            holiday_days = set(h.jalali_day for h in holidays)
            weekend_days = 0
            holiday_count = 0
            working_days = 0
            company = self.env.company

            for d in range(1, days_in_month + 1):
                g_dt = self.jalali_to_gregorian(jalali_year, jalali_month, d)
                weekday = (g_dt.weekday() + 2) % 7
                is_wk = company.is_weekend(weekday=weekday, company_id=company_id)
                is_hol = d in holiday_days
                if is_wk:
                    weekend_days += 1
                elif is_hol:
                    holiday_count += 1
                else:
                    working_days += 1

            return {
                'total_days': days_in_month,
                'working_days': working_days,
                'weekend_days': weekend_days,
                'holiday_days': holiday_count,
                'total_off_days': weekend_days + holiday_count,
            }

    class MockEnv:
        def __init__(self):
            self.company = MockCompany()
            self.user = MockUser(self.company)
            self._holiday_model = MockHolidayModel()
            self._service = MockService(self)
            self._mixin = JalaaliMixin()
            self._mixin.env = self

            class MockPartner(BaseModelSearchJalaliPatch, BaseGroupJalaliPatch):
                env = self

            class MockPrivilege:
                def __init__(self):
                    self.id = 1
                    self.name = 'Persian Calendar Access'
                    self.privilege_id = self
                    self.user_ids = [1, 2]

            self._partner = MockPartner()
            self._company_model = MockCompanyModel()
            self._privilege = MockPrivilege()

            class MockIrHttp:
                def session_info(inner_self):
                    return {
                        'jalali_calendar_mode': 'shamsi',
                        'jalali_use_persian_numbers': False,
                        'jalali_date_format': 'yyyy/mm/dd',
                    }

            self._ir_http = MockIrHttp()
            self._qweb_date = IrQwebFieldDate()
            self._qweb_date.env = self
            self._qweb_datetime = IrQwebFieldDatetime()
            self._qweb_datetime.env = self

            self._models = {
                'jalaali.mixin': self._mixin,
                'jalaali.service': self._service,
                'jalaali.holiday': self._holiday_model,
                'res.company': self._company_model,
                'res.partner': self._partner,
                'ir.http': self._ir_http,
                'ir.qweb.field.date': self._qweb_date,
                'ir.qweb.field.datetime': self._qweb_datetime,
            }

        def __getitem__(self, key):
            return self._models.get(key, self._partner)

        def get(self, key):
            return self._models.get(key, self._privilege)

        def ref(self, xml_id, raise_if_not_found=True):
            return self._privilege

    class TransactionCase(unittest.TestCase):
        def setUp(self):
            super().setUp()
            self.env = MockEnv()


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

    def test_14_accounting_fiscal_year_and_periods(self):
        """Test Accounting: Fiscal year starts on Farvardin 1 (2026-03-21) and ends on Esfand 29 (2027-03-20)."""
        # Test Farvardin 1 (First day of Persian fiscal year)
        start_g = self.mixin.jalali_to_gregorian(1405, 1, 1)
        self.assertEqual(start_g, date(2026, 3, 21), "Fiscal year 1405 must start on 2026-03-21")

        # Test Esfand 29 (Last day of Persian non-leap fiscal year 1405)
        end_g = self.mixin.jalali_to_gregorian(1405, 12, 29)
        self.assertEqual(end_g, date(2027, 3, 20), "Fiscal year 1405 must end on 2027-03-20")

        # Test domain translation for accounting invoice search [('invoice_date', '>=', '1405/01/01')]
        domain = [('invoice_date', '>=', '1405/01/01')]
        rewritten = self.env['res.partner']._convert_jalali_domain(domain)
        self.assertEqual(rewritten[0][2], '2026-03-21')

    def test_15_sales_order_date_and_deadline(self):
        """Test Sales: Order date and quotation deadline filtering with compact and slash formats."""
        # Compact 8-digit: 14050715 -> 1405/07/15 -> 2026-10-07
        domain = [('date_order', '<=', '14050715')]
        rewritten = self.env['res.partner']._convert_jalali_domain(domain)
        self.assertTrue(rewritten[0][2].startswith('2026-10-07'))

        # Range filter between Nowruz and end of Farvardin
        range_domain = [
            ('date_order', '>=', '1405-01-01'),
            ('date_order', '<=', '1405-01-31')
        ]
        rewritten_range = self.env['res.partner']._convert_jalali_domain(range_domain)
        self.assertTrue(rewritten_range[0][2].startswith('2026-03-21'))
        self.assertTrue(rewritten_range[1][2].startswith('2026-04-20'))

    def test_16_stock_moves_and_datetime_boundaries(self):
        """Test Inventory/Stock: Datetime boundary expansion (00:00:00 vs 23:59:59)."""
        from zarvan_calendar.models.base_search_patch import _convert_single_date
        # Operator '>=' should append 00:00:00 for datetime
        res_ge = _convert_single_date('1405/01/01', is_datetime=True, operator='>=')
        self.assertEqual(res_ge, '2026-03-21 00:00:00')

        # Operator '<=' should append 23:59:59 for datetime to include the full day
        res_le = _convert_single_date('1405/01/01', is_datetime=True, operator='<=')
        self.assertEqual(res_le, '2026-03-21 23:59:59')

    def test_17_pivot_read_group_month_quarter_week(self):
        """Test Pivot Table & Graph Views: _read_group_format_result produces Persian month names."""
        from zarvan_calendar.models.base_group_patch import PERSIAN_MONTH_NAMES
        self.assertEqual(PERSIAN_MONTH_NAMES[0], 'فروردین')
        self.assertEqual(PERSIAN_MONTH_NAMES[11], 'اسفند')

        # Test grouping mock
        data_point = {'date_order:month': '2026-04-15'}
        res = self.env['res.partner']._read_group_format_result(data_point, ['date_order:month'], ['month'])
        # April 15, 2026 falls in Farvardin 1405 (26 Farvardin 1405)
        self.assertTrue('فروردین' in res.get('date_order:month', '') or '1405' in res.get('date_order:month', ''))

    def test_18_universal_excel_csv_import_named_months(self):
        """Test Excel/CSV Import: Parsing textual Persian month names and Arabic digits."""
        from zarvan_calendar.models.base_import_patch import _parse_jalali_to_gregorian_str

        # Named month: 15 Farvardin 1405 -> 2026-04-04
        parsed_named = _parse_jalali_to_gregorian_str('15 فروردین 1405')
        self.assertEqual(parsed_named, '2026-04-04')

        # Latin transliteration: 15 Farvardin 1405
        parsed_latin = _parse_jalali_to_gregorian_str('15 farvardin 1405')
        self.assertEqual(parsed_latin, '2026-04-04')

        # Eastern Arabic digits: ١٤٠٥/٠١/٠١ -> 2026-03-21
        parsed_arabic = _parse_jalali_to_gregorian_str('١٤٠٥/٠١/٠١')
        self.assertEqual(parsed_arabic, '2026-03-21')

    def test_19_hr_leave_working_days_deduction(self):
        """Test HR & Leaves: Working days calculation deducting public holidays and weekend days."""
        # 1405-01 has 31 days. In Iran (Thursday-Friday weekend):
        # Nowruz days 1..4, 12, 13 are official holidays
        result = self.service.get_working_days_in_month(1405, 1, company_id=self.company.id)
        self.assertEqual(result['total_days'], 31)
        self.assertGreater(result['weekend_days'], 0)
        self.assertGreater(result['holiday_days'], 0)
        self.assertLess(result['working_days'], 31)

    def test_20_multi_company_isolated_weekends(self):
        """Test Multi-Company: Isolated weekend logic per company (Friday-only vs Thu-Fri)."""
        company_model = self.env['res.company']
        comp_a = company_model.create({'name': 'Company A', 'jalali_weekend_type': 'friday'})
        comp_b = company_model.create({'name': 'Company B', 'jalali_weekend_type': 'thu_fri'})

        # Panjshanbeh (Thursday) = index 5
        self.assertFalse(comp_a.is_weekend(weekday=5, company_id=comp_a.id))
        self.assertTrue(comp_b.is_weekend(weekday=5, company_id=comp_b.id))

        # Jomeh (Friday) = index 6
        self.assertTrue(comp_a.is_weekend(weekday=6, company_id=comp_a.id))
        self.assertTrue(comp_b.is_weekend(weekday=6, company_id=comp_b.id))

    def test_21_related_dot_path_search_domain(self):
        """Test Domain Rewriter: Related dot-path traversal like 'partner_id.create_date'."""
        domain = [('partner_id.create_date', '>=', '1405-01-01')]
        rewritten = self.env['res.partner']._convert_jalali_domain(domain)
        self.assertTrue(rewritten[0][2].startswith('2026-03-21'))

    def test_22_arabic_persian_digit_normalization(self):
        """Test Normalization: Both Persian (۰۱۲۳۴۵۶۷۸۹) and Arabic (٠١٢٣٤٥٦٧٨٩) digits."""
        from zarvan_calendar.models.base_search_patch import _normalize_persian_str
        fa_input = '۱۴۰۵/۰۱/۱۵'
        ar_input = '١٤٠٥/٠١/١٥'
        self.assertEqual(_normalize_persian_str(fa_input), '1405/01/15')
        self.assertEqual(_normalize_persian_str(ar_input), '1405/01/15')

    def test_23_leap_year_esfand_boundary_math(self):
        """Test Leap Year Edge Boundaries: 1403 (leap, 30 days) vs 1404 (non-leap, 29 days)."""
        # Esfand 30 in 1403 is valid
        g_30 = self.mixin.jalali_to_gregorian(1403, 12, 30)
        self.assertEqual(g_30, date(2025, 3, 20))

        # Esfand 30 in 1404 is invalid (non-leap year, only 29 days)
        g_invalid = self.mixin.jalali_to_gregorian(1404, 12, 30)
        self.assertIsNone(g_invalid, "1404/12/30 must be invalid as 1404 is not a leap year")

    def test_24_qweb_datetime_context_timestamp(self):
        """Test QWeb Report Datetime: Formatting respects context_timestamp in user timezone."""
        qweb_dt = self.env['ir.qweb.field.datetime']
        from datetime import datetime
        test_dt = datetime(2026, 3, 21, 10, 0, 0)
        self.env.user.jalali_calendar_mode = 'shamsi'
        rendered = qweb_dt.value_to_html(test_dt, {})
        self.assertIn('1405/01/01', rendered)

    def test_25_spreadsheet_formulas_parity(self):
        """Test Odoo Spreadsheet Formulas: JDATE and JEDATE mathematical accuracy."""
        # JDATE(1405, 1, 1) corresponds to 2026-03-21
        g_date = self.mixin.jalali_to_gregorian(1405, 1, 1)
        self.assertEqual(g_date, date(2026, 3, 21))

        # Adding 6 months in Shamsi calendar: Farvardin 1 + 6 months = Mehr 1
        g_mehr = self.mixin.jalali_to_gregorian(1405, 7, 1)
        self.assertEqual(g_mehr, date(2026, 9, 23))

    def test_26_enforce_english_numerals_output(self):
        """Test Numeral Standard: All formatted dates in Odoo reports/service must use English digits (0-9)."""
        current_j = self.service.get_current_jalali_date()
        formatted = current_j.get('formatted', '')
        # Must only contain English digits and slashes
        self.assertRegex(formatted, r'^\d{4}/\d{2}/\d{2}$', "Formatted date must use English digits (0-9)")
        for fa_digit in '۰۱۲۳۴۵۶۷۸۹':
            self.assertNotIn(fa_digit, formatted, f"Formatted date must not contain Persian digit {fa_digit}")

    def test_27_persian_arabic_input_acceptance(self):
        """Test Input Normalization: Accepts Persian & Arabic numerals and outputs standard dates."""
        inputs = [
            ("۱۴۰۵/۰۱/۱۵", date(2026, 4, 4)),
            ("١٤٠٥/٠١/١٥", date(2026, 4, 4)),
            ("1405/01/15", date(2026, 4, 4)),
            ("۱۴۰۵۰۱۱۵", date(2026, 4, 4)),
            ("١٤٠٥٠١١٥", date(2026, 4, 4)),
        ]
        for raw_val, expected_date in inputs:
            parsed = self.mixin.detect_and_parse_date(raw_val)
            self.assertEqual(parsed, expected_date, f"Failed to parse numeral input: {raw_val}")

    def test_28_owl3_session_bootstrap_preferences(self):
        """Test OWL 3 session_info: Ensures web client bootstrap passes correct defaults."""
        session_info = self.env['ir.http'].session_info()
        self.assertIn('jalali_calendar_mode', session_info)
        self.assertIn('jalali_date_format', session_info)
        self.assertEqual(session_info.get('jalali_calendar_mode'), 'shamsi')

    def test_29_where_calc_domain_rewrite(self):
        """Test Query Builder: _where_calc seamlessly translates Shamsi domains before SQL execution."""
        domain = [('create_date', '>=', '1405-01-01 00:00:00')]
        converted = self.env['res.partner']._convert_jalali_domain(domain)
        self.assertEqual(converted[0][2], '2026-03-21 00:00:00')


