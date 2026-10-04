import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  jalaaliToGregorian,
  gregorianToJalaali,
  getDaysInJalaaliMonth,
  getJalaaliWeekday,
  getCurrentJalaaliDate,
  PERSIAN_WEEKDAYS,
  parseDateString,
} from './src/lib/jalaali.js';
import {
  INITIAL_HOLIDAYS,
  INITIAL_COMPANIES,
  INITIAL_PREFERENCES,
  HolidayRecord,
  CompanySetting,
  UserPreferences,
} from './src/data/holidays.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIdx = process.argv.indexOf('--port');
const portFromArg = portArgIdx !== -1 ? parseInt(process.argv[portArgIdx + 1], 10) : NaN;
const PORT = !isNaN(portFromArg) ? portFromArg : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-Memory Data Store (per AI Studio ephemeral runtime pattern)
let holidays: HolidayRecord[] = JSON.parse(JSON.stringify(INITIAL_HOLIDAYS));
let companies: CompanySetting[] = JSON.parse(JSON.stringify(INITIAL_COMPANIES));
let preferences: UserPreferences = { ...INITIAL_PREFERENCES };

// Helper to check if a weekday is a weekend for a company
function isCompanyWeekend(company: CompanySetting, weekdayIndex: number): boolean {
  if (company.jalali_weekend_type === 'friday') {
    return weekdayIndex === 6;
  } else if (company.jalali_weekend_type === 'thu_fri') {
    return weekdayIndex === 5 || weekdayIndex === 6;
  } else if (company.jalali_weekend_type === 'custom' && company.jalali_weekend_custom) {
    const days = company.jalali_weekend_custom.split(',').map((d) => parseInt(d.trim(), 10));
    return days.includes(weekdayIndex);
  }
  return false;
}

// -------------------------------------------------------------
// REST API Endpoints (as defined in Zarvan Calendar Odoo spec)
// -------------------------------------------------------------

// 1. GET /api/jalaali/holidays/:year
app.get('/api/jalaali/holidays/:year', (req: Request, res: Response) => {
  try {
    const year = parseInt(String(req.params.year), 10);
    const companyId = req.query.company_id ? parseInt(String(req.query.company_id), 10) : null;

    if (isNaN(year)) {
      return res.status(400).json({ success: false, error: 'Invalid year parameter' });
    }

    const yearHolidays = holidays.filter((h) => {
      if (!h.is_active) return false;
      if (companyId && h.company_id && h.company_id !== companyId) return false;
      // Fixed holidays (jalali_year === null) apply every year
      if (h.jalali_year === null) return true;
      return h.jalali_year === year;
    }).map((h) => {
      const gDate = jalaaliToGregorian(year, h.jalali_month, h.jalali_day);
      return {
        ...h,
        display_year: year,
        gregorian_date: gDate ? `${gDate.year}-${String(gDate.month).padStart(2, '0')}-${String(gDate.day).padStart(2, '0')}` : null,
      };
    });

    return res.json({
      success: true,
      data: {
        year,
        holidays: yearHolidays,
        count: yearHolidays.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// 2. POST /api/jalaali/is-holiday
app.post('/api/jalaali/is-holiday', (req: Request, res: Response) => {
  try {
    const { year, month, day, company_id } = req.body;
    if (!year || !month || !day) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: year, month, day' });
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const cId = company_id ? parseInt(company_id, 10) : null;

    const weekday = getJalaaliWeekday(y, m, d);
    const company = companies.find((c) => c.id === (cId || 1)) || companies[0];
    const isWeekend = isCompanyWeekend(company, weekday);

    const holidayMatch = holidays.find((h) => {
      if (!h.is_active) return false;
      if (cId && h.company_id && h.company_id !== cId) return false;
      const yearMatches = h.jalali_year === null || h.jalali_year === y;
      return yearMatches && h.jalali_month === m && h.jalali_day === d;
    });

    const isHoliday = Boolean(holidayMatch) || isWeekend;

    return res.json({
      success: true,
      data: {
        is_holiday: isHoliday,
        is_official_holiday: Boolean(holidayMatch),
        is_weekend: isWeekend,
        holiday_name: holidayMatch ? holidayMatch.name : (isWeekend ? 'تعطیل پایان هفته (Weekend)' : null),
        holiday_type: holidayMatch ? holidayMatch.holiday_type : (isWeekend ? 'weekend' : null),
        is_national: holidayMatch ? holidayMatch.is_national : false,
        weekday,
        weekday_name: PERSIAN_WEEKDAYS[weekday].name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// 3. POST /api/jalaali/convert/jalali-to-gregorian
app.post('/api/jalaali/convert/jalali-to-gregorian', (req: Request, res: Response) => {
  try {
    const { year, month, day } = req.body;
    if (!year || !month || !day) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: year, month, day' });
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    const greg = jalaaliToGregorian(y, m, d);
    if (!greg) {
      return res.status(400).json({ success: false, error: 'Invalid Jalali date' });
    }

    const jStr = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    const gStr = `${greg.year}-${String(greg.month).padStart(2, '0')}-${String(greg.day).padStart(2, '0')}`;

    return res.json({
      success: true,
      data: {
        jalali: jStr,
        gregorian: gStr,
        details: {
          gregorianYear: greg.year,
          gregorianMonth: greg.month,
          gregorianDay: greg.day,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// 4. POST /api/jalaali/convert/gregorian-to-jalali
app.post('/api/jalaali/convert/gregorian-to-jalali', (req: Request, res: Response) => {
  try {
    const { year, month, day } = req.body;
    if (!year || !month || !day) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: year, month, day' });
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    const jal = gregorianToJalaali(y, m, d);
    if (!jal) {
      return res.status(400).json({ success: false, error: 'Invalid Gregorian date' });
    }

    const gStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const jStr = `${jal.year}/${String(jal.month).padStart(2, '0')}/${String(jal.day).padStart(2, '0')}`;

    return res.json({
      success: true,
      data: {
        gregorian: gStr,
        jalali: jStr,
        details: {
          jalaliYear: jal.year,
          jalaliMonth: jal.month,
          jalaliDay: jal.day,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// 5. GET /api/jalaali/current
app.get('/api/jalaali/current', (_req: Request, res: Response) => {
  try {
    const current = getCurrentJalaaliDate();
    return res.json({
      success: true,
      data: current,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// 6. GET /api/jalaali/working-days/:year/:month
app.get('/api/jalaali/working-days/:year/:month', (req: Request, res: Response) => {
  try {
    const year = parseInt(String(req.params.year), 10);
    const month = parseInt(String(req.params.month), 10);
    const companyId = req.query.company_id ? parseInt(String(req.query.company_id), 10) : 1;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Invalid year or month' });
    }

    const company = companies.find((c) => c.id === companyId) || companies[0];
    const totalDays = getDaysInJalaaliMonth(year, month);

    const monthHolidays = holidays.filter((h) => {
      if (!h.is_active) return false;
      if (companyId && h.company_id && h.company_id !== companyId) return false;
      const yearMatches = h.jalali_year === null || h.jalali_year === year;
      return yearMatches && h.jalali_month === month;
    });

    const holidayDaysSet = new Set(monthHolidays.map((h) => h.jalali_day));

    let workingDays = 0;
    let weekendDays = 0;
    let nonWeekendHolidays = 0;
    const dailyBreakdown: any[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const weekday = getJalaaliWeekday(year, month, day);
      const isWeekend = isCompanyWeekend(company, weekday);
      const isHoliday = holidayDaysSet.has(day);

      if (isWeekend) {
        weekendDays++;
      } else if (isHoliday) {
        nonWeekendHolidays++;
      } else {
        workingDays++;
      }

      const holidayDetail = monthHolidays.find((h) => h.jalali_day === day);
      dailyBreakdown.push({
        day,
        weekday,
        weekdayName: PERSIAN_WEEKDAYS[weekday].name,
        isWeekend,
        isHoliday,
        holidayName: holidayDetail ? holidayDetail.name : null,
        isWorkingDay: !isWeekend && !isHoliday,
      });
    }

    return res.json({
      success: true,
      data: {
        year,
        month,
        total_days: totalDays,
        working_days: workingDays,
        weekend_days: weekendDays,
        holiday_days: nonWeekendHolidays,
        total_off_days: weekendDays + nonWeekendHolidays,
        company: {
          id: company.id,
          name: company.name,
          weekend_type: company.jalali_weekend_type,
        },
        holidays_in_month: monthHolidays,
        daily_breakdown: dailyBreakdown,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Additional CRUD & Management APIs

// GET /api/jalaali/all-holidays
app.get('/api/jalaali/all-holidays', (_req: Request, res: Response) => {
  return res.json({ success: true, data: holidays });
});

// POST /api/jalaali/holidays (Create Holiday)
app.post('/api/jalaali/holidays', (req: Request, res: Response) => {
  try {
    const { name, jalali_year, jalali_month, jalali_day, holiday_type, is_national, description, company_id } = req.body;
    if (!name || !jalali_month || !jalali_day) {
      return res.status(400).json({ success: false, error: 'Name, month, and day are required' });
    }

    const newHoliday: HolidayRecord = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name,
      jalali_year: jalali_year ? parseInt(jalali_year, 10) : null,
      jalali_month: parseInt(jalali_month, 10),
      jalali_day: parseInt(jalali_day, 10),
      holiday_type: holiday_type || 'fixed',
      is_national: Boolean(is_national),
      is_active: true,
      description: description || '',
      company_id: company_id ? parseInt(company_id, 10) : null,
    };

    holidays.unshift(newHoliday);
    return res.status(201).json({ success: true, data: newHoliday });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to create holiday' });
  }
});

// DELETE /api/jalaali/holidays/:id
app.delete('/api/jalaali/holidays/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = holidays.findIndex((h) => h.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Holiday not found' });
  }
  holidays.splice(index, 1);
  return res.json({ success: true, message: 'Holiday deleted successfully' });
});

// GET & PUT Companies
app.get('/api/jalaali/companies', (_req: Request, res: Response) => {
  return res.json({ success: true, data: companies });
});

app.put('/api/jalaali/companies/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const company = companies.find((c) => c.id === id);
  if (!company) {
    return res.status(404).json({ success: false, error: 'Company not found' });
  }

  const { jalali_weekend_type, jalali_weekend_custom, fiscal_year_start_month, name } = req.body;
  if (name) company.name = name;
  if (jalali_weekend_type) company.jalali_weekend_type = jalali_weekend_type;
  if (jalali_weekend_custom !== undefined) company.jalali_weekend_custom = jalali_weekend_custom;
  if (fiscal_year_start_month) company.fiscal_year_start_month = parseInt(fiscal_year_start_month, 10);

  return res.json({ success: true, data: company });
});

// GET & PUT Preferences
app.get('/api/jalaali/preferences', (_req: Request, res: Response) => {
  return res.json({ success: true, data: preferences });
});

app.post('/api/jalaali/preferences', (req: Request, res: Response) => {
  preferences = { ...preferences, ...req.body };
  return res.json({ success: true, data: preferences });
});

// POST /api/jalaali/import-csv (CSV / batch date parser)
app.post('/api/jalaali/import-csv', (req: Request, res: Response) => {
  try {
    const { csvText, company_id, force_import } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ success: false, error: 'CSV text is required' });
    }

    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      return res.status(400).json({ success: false, error: 'Empty CSV' });
    }

    const imported: HolidayRecord[] = [];
    const errors: string[] = [];

    // Check header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') || firstLine.includes('holiday') || firstLine.includes('نام');
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length < 3) {
        errors.push(`Line ${i + 1}: Insufficient columns`);
        continue;
      }

      // Format can be: Name, Year, Month, Day OR Name, Month, Day OR Name, Date
      const name = parts[0];
      let y: number | null = null;
      let m: number = 0;
      let d: number = 0;

      if (parts.length >= 4) {
        y = parts[1] && parts[1] !== 'null' && parts[1] !== '-' ? parseInt(parts[1], 10) : null;
        m = parseInt(parts[2], 10);
        d = parseInt(parts[3], 10);
      } else if (parts.length === 3) {
        // Name, Month, Day
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      } else if (parts.length === 2) {
        // Name, DateString
        const parsed = parseDateString(parts[1]);
        if (parsed) {
          y = parsed.isJalali ? parsed.year : null;
          m = parsed.month;
          d = parsed.day;
        }
      }

      if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
        errors.push(`Line ${i + 1}: Invalid date components for "${name}"`);
        if (!force_import) continue;
      }

      const rec: HolidayRecord = {
        id: 'csv_' + Date.now() + '_' + i,
        name: name || `تعطیلی ردیف ${i + 1}`,
        jalali_year: y,
        jalali_month: m,
        jalali_day: d,
        holiday_type: y ? 'lunar' : 'fixed',
        is_national: true,
        is_active: true,
        company_id: company_id ? parseInt(company_id, 10) : null,
      };

      imported.push(rec);
      holidays.unshift(rec);
    }

    return res.json({
      success: true,
      data: {
        total_rows: lines.length - startIdx,
        imported_count: imported.length,
        error_count: errors.length,
        errors: errors.slice(0, 10),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Import failed' });
  }
});

// Reset database to default
app.post('/api/jalaali/reset-holidays', (_req: Request, res: Response) => {
  holidays = JSON.parse(JSON.stringify(INITIAL_HOLIDAYS));
  companies = JSON.parse(JSON.stringify(INITIAL_COMPANIES));
  return res.json({ success: true, message: 'Data reset to Zarvan defaults' });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Zarvan Calendar] Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
