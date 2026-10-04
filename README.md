# Zarvan Persian Calendar - Odoo 19 Enterprise Module

[![Odoo Version](https://img.shields.io/badge/Odoo-19.0-green.svg)](https://www.odoo.com)
[![License](https://img.shields.io/badge/License-LGPL--3-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-19.0.1.0.0-orange.svg)]()
[![Performance](https://img.shields.io/badge/Performance-Zero--RPC%20O(1)-emerald.svg)]()

## Overview

**Zarvan Persian Calendar** is an enterprise-grade Jalali (Persian / Solar Hijri) localization engine for **Odoo 19.0**.

Unlike traditional Persian modules that require manually inheriting every individual XML view, Zarvan uses **Global Core Framework Interception**. It automatically converts dates across all current and future Odoo modules—including Pivot tables, Graph views, Search filters, PDF invoices, and Excel imports—while keeping the underlying PostgreSQL database 100% standard Gregorian UTC.

---

## 🚀 Key Architectural Innovations

### 1. Universal Zero-XML View Interception
* **Global Web Client Hook (`@web/core/l10n/dates`)**: Intercepts `formatDate`, `formatDateTime`, and `parseDate`.
* **Zero View Maintenance**: Automatically renders Jalali dates in all Tree/List columns, Form fields, Kanban cards, and Activity widgets across standard Odoo apps (Accounting, Sales, CRM, Inventory, HR, etc.) and any third-party addon installed in the future.
* **No XML bloat**: You do not have to modify or inherit view XML files.

### 2. Universal PDF & HTML Reports
* **QWeb Report Interceptors (`ir.qweb.field.date` & `datetime`)**:
  - Automatically prints Persian dates on Invoices, Quotations, Purchase Orders, Delivery Slips, and Payslips.
  - Timezone-aware: Automatically converts UTC timestamps into the user's localized timezone (`context_timestamp`) before formatting.
  - Multi-language safe: If printing an invoice for a European customer in English (`en_US`), it cleanly defaults to Gregorian.

### 3. Pivot Tables, Graph Views & Search Group-By
* **`BaseModel._read_group_format_result` Hook**:
  - When grouping sales or financial records by date, grouped headers automatically show Persian Month names (**فروردین ۱۴۰۵**, **اردیبهشت ۱۴۰۵**), Jalali Years (**۱۴۰۵**), Quarters (**سه‌ماهه اول ۱۴۰۵**), and Weeks (**هفته ۱۴ سال ۱۴۰۵**).

### 4. Search Query Rewriter (PostgreSQL Index Preservation)
* **`BaseModel._search` Hook**:
  - When users enter a Shamsi date into search bars or filters (e.g. `1405-01-01`, `۱۴۰۵/۰۱/۰۱`, or `14050101`), the domain rewriter translates the operand to Gregorian (`2026-03-21`) before generating SQL.
  - **Zero Query Slowdown**: PostgreSQL queries native indexed date columns directly. Native B-Tree indexes remain 100% active.

### 5. Universal Excel & CSV Import Engine
* **`base_import.import._parse_date_from_data` Hook**:
  - When importing customer spreadsheets, price lists, or orders via Odoo's native **Favorites ➔ Import Records** wizard, Shamsi dates are automatically detected and converted to Gregorian.
  - Supports numeric formats (`YYYY/MM/DD`, `DD/MM/YYYY`, `YYYYMMDD`), Persian digits (`۰–۹`), and Persian month names (`۱۵ فروردین ۱۴۰۵`).

### 6. Odoo Documents Spreadsheet & Jalali Formulas (`o-spreadsheet`)
* Integrates directly into Odoo's built-in Spreadsheet engine:
  - **`=JDATE(year, month, day)`**: Creates a date serial from Persian year, month, and day (e.g. `=JDATE(1405, 1, 15)`).
  - **`=JEDATE(date, months)`**: Adds/subtracts Persian calendar months (respects 31-day first 6 months, 30-day next 5 months, and 29/30-day Esfand).
  - **`=JEOMONTH(date, months)`**: Returns the exact last day of the Shamsi month.
  - **`=JYEAR(date)`**, **`=JMONTH(date)`**, **`=JDAY(date)`**: Extracts Shamsi calendar components.
  - **`=JMONTHNAME(date)`**: Returns Persian month name (e.g. "فروردین").
  - **`=JFORMAT(date)`**: Returns formatted Shamsi date string (`YYYY/MM/DD`).
  - **Date Arithmetic**: Calculations like `=A1 + 10` or `=A1 - 7` work naturally with cell date formatting.

### 7. Relative Dates in Chatter & Messages
* **`formatRelativeTime` Patch**:
  - Natural Persian expressions: **امروز**, **دیروز**, **۲ روز پیش**, **هفته گذشته**, **ماه گذشته**, **فردا**, **پس‌فردا**, **در ۳ روز آینده**, **هفته آینده**, and **لحظاتی پیش**.

### 7. Per-User Display Mode Configuration (`res.users`)
* Every user can configure their preferred display mode:
  - **`shamsi`**: Shamsi only (e.g. `۱۴۰۵/۰۱/۰۱`).
  - **`gregorian`**: Gregorian only (e.g. `2026-03-21`).
  - **`both`**: Both simultaneously with Gregorian in parentheses: **`۱۴۰۵/۰۱/۰۱ (2026-03-21)`**.
  - Toggle Persian numerals (`۰–۹`) on or off.

### 8. Top Navbar Systray Widget
* **OWL 2.0 Systray Component (`today_systray.js`)**:
  - Displays today's Shamsi date, weekday, and working/holiday status directly in Odoo's top header.
  - Interactive popover shows corresponding Gregorian date and active holidays with a shortcut to the Calendar manager.

### 9. Ultra-Fast In-Memory O(1) Bitwise LRU Cache
* Date calculations use an in-memory bitwise hash map: `(gy << 9) | (gm << 5) | gd`.
* **Zero RPC latency**: Renders 10,000+ date cells in under 5 milliseconds in the browser thread. Faster than Redis with zero network serialization overhead.

---

## 📦 Installation & Setup

### Prerequisites
```bash
pip install jdatetime>=4.1.0 openpyxl>=3.0.10 python-dateutil>=2.8.2
```

### Module Installation
1. Clone or copy `zarvan_calendar` into your Odoo `addons` directory:
   ```bash
   git clone https://github.com/ehsan-r97/Odoo19Custom_Addons.git
   cp -r Odoo19Custom_Addons/zarvan_calendar /path/to/odoo/addons/
   ```
2. Restart Odoo server:
   ```bash
   ./odoo-bin -c odoo.conf -u zarvan_calendar -d your_database
   ```
3. In Odoo web interface:
   - Activate Developer Mode.
   - Go to **Apps ➔ Update Apps List**.
   - Search for **Zarvan Persian Calendar** and click **Install**.

---

## ⚙️ Configuration

### Company Settings (**Settings ➔ Companies ➔ Persian Calendar Settings**)
* **Weekend Type**:
  - `Friday Only`: Standard Iranian government schedule (Friday off).
  - `Thursday & Friday`: Iranian commercial & private enterprise schedule (Thursday and Friday off).
  - `Custom`: Custom weekend days (e.g. Saturday & Sunday for international branches).
* **Fiscal Year Start**: Select Jalali start month (Farvardin, Dey, etc.).
* **Auto-create Holidays**: Pre-populates official holidays for years 1400–1410.

### User Preferences (**Settings ➔ Users ➔ Persian Calendar Preferences**)
* **Calendar Display Mode**: `Shamsi Only`, `Both (Shamsi with Gregorian)`, or `Gregorian Only`.
* **Date Format**: Choose from `YYYY/MM/DD`, `YYYY-MM-DD`, `YYYYMMDD`, `DD/MM/YYYY`, etc.
* **Persian Numbers**: Toggle Persian numerals (`۰–۹`) across the entire interface.

---

## 🌐 RESTful API Endpoints

Zarvan provides high-speed JSON API endpoints for external applications (mobile apps, eCommerce, microservices):

| Endpoint | Method | Description |
|---|---|---|
| `/api/jalaali/convert/g2j` | `GET/POST` | Converts Gregorian date to Jalali |
| `/api/jalaali/convert/j2g` | `GET/POST` | Converts Jalali date to Gregorian |
| `/api/jalaali/holidays` | `GET/POST` | Retrieves or creates calendar holidays |
| `/api/jalaali/working-days` | `GET` | Calculates working days and duty hours |
| `/api/jalaali/preferences` | `GET/POST` | Retrieves or updates user calendar preferences |

---

## 🛡️ Automated Unit & Regression Tests

Run the built-in test suite to verify module integrity:
```bash
./odoo-bin -c odoo.conf -d your_database --test-enable --stop-after-init -i zarvan_calendar
```

Tested scenarios include:
* 33-year Khayyam astronomical leap year calculations.
* Bidirectional conversions and inverse parity.
* Multi-company weekend logic and duty hours calculation.
* Search domain translation (Shamsi query ➔ Gregorian SQL).
* Multi-year lunar holiday overlap constraints.

---

## 📄 License
Licensed under the **GNU Lesser General Public License v3.0 (LGPL-3)**.
Developed by **Ehsan Rezaei** (<https://github.com/ehsan-r97/Odoo19Custom_Addons>).
