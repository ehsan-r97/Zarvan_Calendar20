=====================================
Zarvan Persian Calendar Documentation
=====================================

Zarvan Persian Calendar is an enterprise-grade Jalali localization engine natively built for Odoo 20.0 Enterprise & Community.

Key Architectural Capabilities
==============================

1. Universal Zero-XML View Interception
---------------------------------------
Intercepts ``@web/core/l10n/dates`` directly in the browser runtime. Automatically formats Jalali dates across all models and views (List, Form, Kanban, Activity, Pivot, Graph) without requiring inheritance or modification of view XML files.

2. Minimalist Header Systray & Clean User Configuration
-------------------------------------------------------
- Ultra-minimalist top header systray displaying strictly today's Persian date and weekday with zero visual noise or holiday badges.
- Display mode preferences (Shamsi only, Both simultaneously, Gregorian only) are cleanly managed in user profile preferences (``res.users``).

3. QWeb PDF Report Formatting
-----------------------------
Hooks into ``ir.qweb.field.date`` and ``ir.qweb.field.datetime`` to format invoices, delivery slips, and financial statements in Persian, localizing UTC timestamps to the user's timezone while cleanly preserving Gregorian formatting for foreign partners.

4. Search Query Rewriter (B-Tree Index Preservation)
----------------------------------------------------
Translates Shamsi date filters in ``BaseModel._search`` into standard UTC Gregorian ranges before SQL execution, maintaining 100% PostgreSQL B-Tree index speed.

5. Spreadsheet Engine Integration
---------------------------------
Provides native ``o-spreadsheet`` functions: ``=JDATE``, ``=JEDATE``, ``=JEOMONTH``, ``=JYEAR``, ``=JMONTH``, ``=JDAY``, ``=JMONTHNAME``, and ``=JFORMAT``.

6. High-Speed Performance Benchmarks
------------------------------------
- Pure Python Gregorian to Jalali: 1,789,960 ops/sec
- Pure Python Jalali to Gregorian: 1,740,862 ops/sec
- Excel / CSV Import Engine: 3,560,318 rows/sec
- Zero external pip package dependencies (100% self-contained standard library)

Installation
============

1. Place the ``zarvan_calendar`` folder in your Odoo addons path.
2. Update the apps list in Developer Mode.
3. Install **Zarvan Persian Calendar**.
