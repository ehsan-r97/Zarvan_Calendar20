# Zarvan Persian Calendar for Odoo 20 (Technical Documentation)

## Architecture Overview

Zarvan Persian Calendar (v20.0.1.0.0) is built around **Non-Invasive Core Framework Interception**, designed natively and exclusively for Odoo 20. 

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

### 4. Systray Header & DatePicker Components
* **OWL 3 Components**: Registered in `registry.category("systray")` and `registry.category("fields")`.
  * Shows today's Persian date, weekday, and holiday status in the top navigation bar.
  * Dedicated OWL 3 `jalali_date` picker with responsive bottom-sheet for mobile.
  * **English Numerals Standard**: Odoo UI, invoices, and reports always display clean English numerals (`0-9`) to prevent PDF font corruption, while seamlessly accepting Persian (`۰-۹`) and Arabic (`٠-٩`) numerals on user input.
  * **Focused Quick Action**: Features a single-click «امروز» (Today) instant selector without cluttered shortcuts.

## Automated Test Execution (29 Standard Tests)
```bash
./odoo-bin -c odoo.conf -d <db_name> --test-enable --test-tags=zarvan_calendar --stop-after-init
```
