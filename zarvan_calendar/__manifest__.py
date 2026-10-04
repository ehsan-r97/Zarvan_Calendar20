# -*- coding: utf-8 -*-
# Part of Zarvan Persian Calendar. See LICENSE file for full copyright and licensing details.

{
    'name': 'Zarvan Persian Calendar',
    'version': '20.0.1.0.0',
    'category': 'Localization',
    'summary': 'Enterprise Jalali Calendar, Global Zero-XML View & Report Conversion, Pivot/Graph Grouping, and Excel Import for Odoo 20 & 19',
    'description': """
Zarvan Persian Calendar for Odoo 20 & 19 (Enterprise Edition)
==============================================================
A high-performance, enterprise-grade Jalali (Persian / Solar Hijri) localization engine for Odoo 20.0 & 19.0.

Core Architectural Innovations:
--------------------------------
1. Universal Zero-XML UI Date Conversion:
   * Intercepts core web client formatters (@web/core/l10n/dates).
   * Automatically displays Jalali dates across ALL List/Tree views, Forms, Kanban cards, and Activity widgets without modifying a single view XML file.
   * Immediately works on any future third-party or standard module installed.

2. Universal PDF & HTML Report Conversion:
   * Hooks into core QWeb report models (ir.qweb.field.date & datetime).
   * Automatically prints Persian dates on Invoices, Quotations, Purchase Orders, Delivery Slips, and Payslips.

3. Pivot Table, Graph View, and Search Group-By:
   * Formats grouped date intervals directly into Persian Month names (فروردین, اردیبهشت), Jalali Years (۱۴۰۵), Quarters, and Weeks in sales and financial reports.

4. Search Query Rewriter (PostgreSQL Index Preservation):
   * Recursively translates Shamsi date filters in search bars and domains to Gregorian UTC before hitting the database.
   * Guarantees 100% database storage in standard Gregorian UTC while preserving PostgreSQL B-Tree index speeds.

5. Universal Excel & CSV Import Engine:
   * Intercepts base_import.import._parse_date_from_data.
   * Automatically converts Shamsi dates, Persian numerals (۰–۹), and Persian month names (e.g. '۱۵ فروردین ۱۴۰۵') in uploaded spreadsheets into standard Gregorian dates.

6. Per-User Display Mode Configuration:
   * Each user can choose: 'Shamsi Only', 'Gregorian Only', or 'Both' (e.g. ۱۴۰۵/۰۱/۱۵ (2026-04-04)).
   * Optional Persian numeral conversion (۰–۹).

7. Top Navbar Systray Widget:
   * Displays today's Shamsi date, weekday, and holiday status directly in the top header bar with a quick dropdown.

8. Ultra-Fast In-Memory O(1) Bitwise LRU Cache:
   * Zero-network latency, zero-RPC client-side caching capable of converting 10,000+ date cells in under 5 milliseconds.

9. Multi-Company Working Days & Calendar:
   * Configurable weekend policies (Friday only, Thursday-Friday, or custom).
   * Preloaded national & lunar holidays with annual working day calculator.
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
