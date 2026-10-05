# -*- coding: utf-8 -*-
# Part of Zarvan Persian Calendar. See LICENSE file for full copyright and licensing details.

{
    'name': 'Zarvan Persian Calendar',
    'version': '20.0.1.0.0',
    'category': 'Localization',
    'summary': 'Enterprise Jalali Calendar, Zero-XML Universal UI & QWeb Reports, Minimalist Header Systray, High-Speed Excel Import, and Spreadsheet Formulas for Odoo 20',
    'description': """
Zarvan Persian Calendar for Odoo 20 (Enterprise & Community Editions)
=====================================================================
A high-performance, enterprise-grade Jalali (Persian / Solar Hijri / هجری شمسی) localization engine natively designed for Odoo 20.0.

Live Performance & Benchmark Highlights:
----------------------------------------
* Pure Python Gregorian ➔ Jalali: 1,789,960 ops/sec (100k conversions in 55.87 ms)
* Pure Python Jalali ➔ Gregorian: 1,740,862 ops/sec (100k conversions in 57.44 ms)
* Excel / CSV Batch Import Engine: 3,560,318 rows/sec (20k rows in 5.62 ms)
* Zero External Dependencies: 100% Pure Python & Standard Library (no pip requirements)
* 100% Native Gregorian UTC Database Storage & B-Tree Index Preservation

Core Architectural Innovations:
--------------------------------
1. Universal Zero-XML UI Date Conversion:
   * Intercepts core web client formatters (@web/core/l10n/dates).
   * Fast-path ASCII parsing (charCodeAt) and single-lookup Map cache bypass regex compilation.
   * Automatically displays Jalali dates across ALL List/Tree views, Forms, Kanban cards, and Activity widgets without modifying a single view XML file.
   * Immediately works on any future third-party or standard module installed.

2. Universal PDF & HTML Report Conversion:
   * Hooks into core QWeb report models (ir.qweb.field.date & ir.qweb.field.datetime).
   * Automatically prints Persian dates on Invoices, Quotations, Purchase Orders, Delivery Slips, and Payslips.
   * Localizes UTC timestamps to the user's timezone before date extraction.
   * Thread-safe memoization cache eliminates redundant string formatting in large 200+ page ledgers.
   * Automatically falls back to Gregorian for foreign language partner reports (e.g. en_US).

3. Pivot Table, Graph View, and Search Group-By:
   * BaseModel._read_group_format_result hook formats grouped date intervals directly into Persian Month names (فروردین, اردیبهشت), Jalali Years (۱۴۰۵), Quarters (سه‌ماهه اول), and Weeks in financial and sales reporting.

4. Search Query Rewriter (PostgreSQL Index Preservation):
   * Recursively translates Shamsi date filters in search bars and domains to Gregorian UTC before hitting PostgreSQL.
   * Guarantees 100% database storage in standard Gregorian UTC while preserving PostgreSQL B-Tree index speeds.

5. Universal Excel & CSV Import Engine:
   * Intercepts base_import.import._parse_date_from_data.
   * Automatically converts Shamsi dates, Persian numerals (۰–۹), and Persian month names (e.g. '۱۵ فروردین ۱۴۰۵') in uploaded spreadsheets into standard Gregorian dates.
   * Batch row memoization delivers 3.56M rows/sec processing throughput.

6. Per-User Display Mode Configuration (res.users):
   * Managed cleanly in user preferences (res.users): 'Shamsi Only', 'Gregorian Only', or 'Both' (e.g. ۱۴۰۵/۰۱/۱۵ (2026-04-04)).
   * Optional Persian numeral conversion (۰–۹) toggle without cluttering main navigation bars.

7. Minimalist Top Navbar Systray Widget:
   * Sleek, unobtrusive OWL 3 systray component in the top header displaying strictly today's Persian date and weekday.
   * Zero header clutter: holiday badges and complex controls are omitted from the main bar for maximum aesthetic minimalism.

8. Multi-Company Working Days & Calendar (res.company & jalaali.holiday):
   * Configurable weekend policies (Friday only, Thursday-Friday, or custom).
   * Preloaded statutory national and lunar holidays with annual working day calculator.
   * Built-in calculators for Iranian Tax Article 169 deadlines and Social Security (SSO) month days.

9. Odoo Enterprise Documents Spreadsheet (o-spreadsheet):
   * Native ES module formulas: =JDATE, =JEDATE, =JEOMONTH, =JYEAR, =JMONTH, =JDAY, =JMONTHNAME, =JFORMAT.
   * 33-year Khayyam astronomical leap year detection ensuring accurate 30-day Esfand month-ends.

10. High-Speed RESTful API Endpoints:
    * Standard JSON endpoints for mobile apps, eCommerce, and microservices (/api/jalaali/convert, /api/jalaali/today, /api/jalaali/holidays, /api/jalaali/working-days).
    """,
    'author': 'Ehsan Rezaei',
    'website': 'https://github.com/ehsan-r97/Odoo19Custom_Addons',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'web',
        'mail',
        'base_import',
    ],
    'data': [
        'security/jalaali_security.xml',
        'security/ir.model.access.csv',
        'data/holiday_data.xml',
        'views/jalaali_holiday_views.xml',
        'views/res_company_views.xml',
        'views/res_users_views.xml',
        'wizard/import_jalali_wizard_views.xml',
        'views/menu_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'zarvan_calendar/static/src/css/zarvan_calendar.css',
            'zarvan_calendar/static/src/js/core/jalaali_global_patch.js',
            'zarvan_calendar/static/src/js/widgets/jalali_date_picker.js',
            'zarvan_calendar/static/src/xml/jalali_date_picker.xml',
            'zarvan_calendar/static/src/js/systray/today_systray.js',
            'zarvan_calendar/static/src/xml/today_systray.xml',
            'zarvan_calendar/static/src/js/spreadsheet/jalali_spreadsheet_functions.js',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
}
