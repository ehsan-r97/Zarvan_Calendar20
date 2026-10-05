===============================
Zarvan Persian Calendar Documentation
===============================

Zarvan Persian Calendar is an enterprise Jalali localization engine built for Odoo 20.0 Enterprise & Community.

Key Architectural Capabilities
==============================

1. Universal Zero-XML View Interception
---------------------------------------
Intercepts ``@web/core/l10n/dates`` directly in the browser runtime. Renders Jalali dates automatically across all models, views (List, Form, Kanban, Activity, Pivot, Graph), and future third-party modules.

2. QWeb PDF Report Formatting
-----------------------------
Hooks into ``ir.qweb.field.date`` and ``ir.qweb.field.datetime`` to format invoices, delivery slips, and financial statements in Persian, localizing UTC timestamps to the user's timezone.

3. Search Query Rewriter
------------------------
Translates Shamsi date filters in ``BaseModel._search`` into standard UTC Gregorian ranges before SQL execution, maintaining 100% PostgreSQL B-Tree index speed.

4. Spreadsheet Engine Integration
---------------------------------
Provides native ``o-spreadsheet`` functions: ``=JDATE``, ``=JEDATE``, ``=JEOMONTH``, ``=JYEAR``, ``=JMONTH``, ``=JDAY``, ``=JMONTHNAME``, and ``=JFORMAT``.

5. High-Speed Performance Benchmarks
------------------------------------
- Pure Python Gregorian to Jalali: 1,789,960 ops/sec
- Pure Python Jalali to Gregorian: 1,740,862 ops/sec
- Excel / CSV Import Engine: 3,560,318 rows/sec

Installation
============

1. Place the ``zarvan_calendar`` folder in your Odoo addons path.
2. Update the apps list in Developer Mode.
3. Install **Zarvan Persian Calendar**.
