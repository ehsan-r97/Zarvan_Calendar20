# Zarvan Persian Calendar for Odoo 20 (Technical Documentation)

## Architecture Overview

Zarvan Persian Calendar (v20.0.1.0.0) is built around **Non-Invasive Core Framework Interception**, designed natively and exclusively for **Odoo 20.0 Enterprise & Community Editions**. 

### 1. Presentation Layer (Zero-XML View Maintenance)
* **Frontend**: Patches `@web/core/l10n/dates` in JavaScript.
  * Formats all standard `DateField` and `DateTimeField` components in List, Kanban, and Form views into Jalali without editing individual XML view architectures.
  * In-memory bitwise LRU cache `(gy << 9) | (gm << 5) | gd` ensures sub-millisecond rendering for thousands of rows.
* **Backend QWeb Reports**: Inherits `ir.qweb.field.date` and `ir.qweb.field.datetime`.
  * Formats printed invoices and delivery slips into Persian dates, respecting user's selected mode (`shamsi`, `gregorian`, or `both`).

### 2. Search & Aggregation Layer
* **PostgreSQL Performance**: The database stores **100% native UTC Gregorian** ISO timestamps.
* **Search Domain Rewriter**: Inherits `BaseModel._search` and translates Shamsi search filters into Gregorian before SQL execution.
  * Example: `[('create_date', '>=', '1405-01-01')]` is rewritten to `[('create_date', '>=', '2026-03-21')]`.
  * Preserves native PostgreSQL B-Tree indexes for maximum query throughput.
* **Pivot Tables & Graph Views**: Inherits `BaseModel._read_group_format_result` to format grouped intervals (`:month`, `:year`, `:quarter`, `:week`, `:day`) into Persian names.

### 3. Data Ingestion Layer
* **Universal Excel / CSV Import**: Inherits `base_import.import._parse_date_from_data`.
  * Automatically detects and converts Shamsi dates, Persian numerals, and Persian month names during standard Odoo imports.

### 4. Systray Header Component
* **OWL 3 & OWL 2.0 Systray Widget**: Registered in `registry.category("systray")`.
  * Shows today's Persian date, weekday, and holiday status in the top navigation bar.

### 5. Odoo Enterprise Accounting & Financial Reports
* **Fiscal Boundaries**: `res.company.get_jalali_fiscal_year_dates(jalali_year)` computes exact Gregorian bounds for Persian fiscal years.
* **Dynamic Period Ranges**: `jalaali.service.get_jalali_period_date_range(period_type, year, month_or_quarter)` translates period filters (Month, Quarter 1-4, Half-Year 1-2, Annual) into Gregorian ranges for dynamic Balance Sheet, Profit & Loss, and Tax Audit reports.

### 6. Odoo Enterprise Documents Spreadsheet (`o-spreadsheet`)
* Custom Jalali spreadsheet formulas: `=JDATE`, `=JEDATE`, `=JEOMONTH`, `=JYEAR`, `=JMONTH`, `=JDAY`, `=JMONTHNAME`, and `=JFORMAT`.
* 33-year Khayyam astronomical leap year detection ensuring accurate 30-day Esfand month-ends.

### 7. RESTful Web Services & External API
* Native HTTP JSON controller (`zarvan_calendar/controllers/jalaali_api.py`) supporting GET and POST:
  * `/api/jalaali/current`: Today's Persian & Gregorian dates with weekday.
  * `/api/jalaali/convert/g2j` & `/api/jalaali/convert/j2g`: Bidirectional date conversion.
  * `/api/jalaali/holidays`: Holiday management and yearly queries.
  * `/api/jalaali/working-days`: Working days and duty hour calculations.
  * `/api/jalaali/preferences`: User calendar preference management.

## Automated Test Execution
```bash
./odoo-bin -c odoo.conf -d <db_name> --test-enable --test-tags=zarvan_calendar --stop-after-init
```
