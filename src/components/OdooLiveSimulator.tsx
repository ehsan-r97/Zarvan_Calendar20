import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Sparkles,
  Table,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  Eye,
  Calculator,
} from 'lucide-react';
import {
  gregorianToJalaali,
  jalaaliToGregorian,
  parseDateString,
  toPersianDigits,
} from '../lib/jalaali';

interface Props {
  calendarMode: 'shamsi' | 'gregorian' | 'both';
  usePersianNum: boolean;
  dateFormat?: string;
}

export function OdooLiveSimulator({ calendarMode, usePersianNum, dateFormat = 'YYYY/MM/DD' }: Props) {
  const [testDaysOffset, setTestDaysOffset] = useState<number>(0);
  const [pivotGrain, setPivotGrain] = useState<'month' | 'week'>('month');
  const [excelInput, setExcelInput] = useState<string>(
    `نام مشتری,تاریخ سفارش,مبلغ (ریال)
شرکت البرز,1405/01/15,45000000
صنایع نوین,1405/1/1,62000000
گروه پایا,14050115,94000000
بازرگانی پارس,۱۴۰۵/۱/۱,120000000
تولیدی سپهر,۱۴۰۵۰۱۱۵,85000000`
  );

  const formatNum = (val: string | number) => {
    return usePersianNum ? toPersianDigits(val) : String(val);
  };

  // Compute simulated relative date
  const now = new Date();
  const testDate = new Date(now.getTime() + testDaysOffset * 24 * 60 * 60 * 1000);
  const testJ =
    gregorianToJalaali(testDate.getFullYear(), testDate.getMonth() + 1, testDate.getDate()) || {
      year: 1405,
      month: 7,
      day: 12,
    };

  const PERSIAN_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const targetWeekday = PERSIAN_WEEKDAYS[testDate.getDay()];

  const getRelativeText = (offset: number) => {
    if (offset === 0) return 'امروز (Today)';
    if (offset === -1) return 'دیروز (Yesterday)';
    if (offset === -2) return 'پریروز (۲ روز پیش)';
    if (offset >= -6 && offset <= -3) return `${targetWeekday} گذشته (Last ${targetWeekday})`;
    if (offset >= -11 && offset < -6) return 'هفته گذشته (Last week)';
    if (offset >= -18 && offset < -11) return '۲ هفته پیش';
    if (offset >= -45 && offset < -18) return 'ماه گذشته / ماه پیش (Last month)';
    if (offset >= -75 && offset < -45) return '۲ ماه پیش';
    if (offset >= -135 && offset < -75) return 'فصل گذشته / فصل پیش (Last quarter)';
    if (offset >= -400 && offset <= -300) return 'سال گذشته / سال پیش (Last year)';
    if (offset < -400) return `${formatNum(Math.abs(Math.round(offset / 365)))} سال پیش`;

    if (offset === 1) return 'فردا (Tomorrow)';
    if (offset === 2) return 'پس‌فردا';
    if (offset >= 3 && offset <= 6) return `${targetWeekday} آینده (Next ${targetWeekday})`;
    if (offset > 6 && offset <= 11) return 'هفته آینده (Next week)';
    if (offset > 11 && offset <= 18) return '۲ هفته بعد';
    if (offset > 18 && offset <= 45) return 'ماه آینده (Next month)';
    if (offset > 45 && offset <= 75) return '۲ ماه بعد';
    if (offset > 75 && offset <= 135) return 'فصل آینده (Next quarter)';
    if (offset >= 300 && offset <= 400) return 'سال آینده (Next year)';
    if (offset > 400) return `${formatNum(Math.round(offset / 365))} سال بعد`;

    const fmt = dateFormat || 'YYYY/MM/DD';
    const jStr = fmt
      .replace('YYYY', String(testJ.year))
      .replace('MM', String(testJ.month).padStart(2, '0'))
      .replace('DD', String(testJ.day).padStart(2, '0'));
    const finalJ = usePersianNum ? toPersianDigits(jStr) : jStr;
    const gIso = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;

    if (calendarMode === 'gregorian') return gIso;
    if (calendarMode === 'both') return `${finalJ} (${gIso})`;
    return finalJ;
  };

  // Mock Sales Pivot Data Grouped by Jalali Months or Weeks
  const monthlyData = [
    {
      label: `فروردین (${formatNum(1)}) ${formatNum(1405)}`,
      gregorian_equiv: 'March (03) - April (04) 2026',
      orders_count: 42,
      total_sales: 1850000000,
    },
    {
      label: `اردیبهشت (${formatNum(2)}) ${formatNum(1405)}`,
      gregorian_equiv: 'April (04) - May (05) 2026',
      orders_count: 58,
      total_sales: 2420000000,
    },
    {
      label: `خرداد (${formatNum(3)}) ${formatNum(1405)}`,
      gregorian_equiv: 'May (05) - June (06) 2026',
      orders_count: 65,
      total_sales: 3100000000,
    },
    {
      label: `تیر (${formatNum(4)}) ${formatNum(1405)}`,
      gregorian_equiv: 'June (06) - July (07) 2026',
      orders_count: 51,
      total_sales: 2190000000,
    },
  ];

  const weeklyData = [
    {
      label: 'هفته ۱ سال ۱۴۰۵',
      gregorian_equiv: 'W12 2026',
      orders_count: 12,
      total_sales: 420000000,
    },
    {
      label: 'هفته ۲ سال ۱۴۰۵',
      gregorian_equiv: 'W13 2026',
      orders_count: 15,
      total_sales: 680000000,
    },
    {
      label: 'هفته ۳ سال ۱۴۰۵',
      gregorian_equiv: 'W14 2026',
      orders_count: 18,
      total_sales: 790000000,
    },
    {
      label: 'هفته ۴ سال ۱۴۰۵',
      gregorian_equiv: 'W15 2026',
      orders_count: 14,
      total_sales: 510000000,
    },
  ];

  const currentPivotData = pivotGrain === 'month' ? monthlyData : weeklyData;

  // Process Excel input simulator
  const parsedRows = excelInput
    .split('\n')
    .filter((line) => line.trim())
    .map((line, idx) => {
      const parts = line.split(',');
      if (idx === 0) return { isHeader: true, col1: parts[0], col2: parts[1], col3: parts[2] };

      const rawDate = (parts[1] || '').trim();
      let convertedG = 'خطا در تاریخ';
      const parsed = parseDateString(rawDate);
      if (parsed) {
        convertedG = parsed.gregorian;
      }

      return {
        isHeader: false,
        col1: parts[0],
        rawDate: parts[1],
        convertedG,
        col3: parts[2],
      };
    });

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3 space-x-reverse mb-3">
          <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              شبیه‌ساز رفتار زروان در تمام بخش‌های Odoo 20
            </h2>
            <p className="text-xs text-slate-500">
              بررسی عملکرد تاریخ‌های نسبی (دیروز، فردا، هفته گذشته)، جدول محوری (Pivot Table)، ایمپورت اکسل و نماهای زنده (لیست، فرم و فاکتور چاپی QWeb)
            </p>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              حالت نمایش فعال کاربر در Odoo: <strong>{calendarMode === 'both' ? 'هر دو همزمان (شمسی با میلادی در پرانتز)' : calendarMode === 'gregorian' ? 'فقط میلادی استاندارد' : 'فقط خورشیدی (شمسی)'}</strong>
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800">
            {usePersianNum ? 'ارقام: فارسی (۰–۹)' : 'ارقام: انگلیسی (0-9)'}
          </span>
        </div>
      </div>

      {/* Grid: 3 Interactive Simulation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Relative Dates Simulator */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                ۱. تست تاریخ‌های نسبی (دیروز، فردا، هفته پیش، چتر Odoo)
              </h3>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-mono">
              @web/core/l10n/dates
            </span>
          </div>

          <p className="text-xs text-slate-500">
            با جابجایی اسلایدر روز، عبارت نمایشی در پیام‌ها، چت و فعالیت‌های Odoo (Chatter) را شبیه‌سازی کنید:
          </p>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>فاصله زمانی از امروز:</span>
              <span className="font-mono text-emerald-700 font-bold">
                {testDaysOffset === 0 ? 'امروز (0)' : testDaysOffset > 0 ? `+${testDaysOffset} روز` : `${testDaysOffset} روز`}
              </span>
            </div>
            <input
              type="range"
              min="-365"
              max="365"
              value={testDaysOffset}
              onChange={(e) => setTestDaysOffset(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>۱ سال پیش (-۳۶۵)</span>
              <span>فصل پیش (-۹۰)</span>
              <span>امروز (۰)</span>
              <span>فصل بعد (+۹۰)</span>
              <span>۱ سال بعد (+۳۶۵)</span>
            </div>

            {/* Quick preset buttons */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
                تست سریع نمونه‌های پرکاربرد Odoo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'دیروز', days: -1 },
                  { label: 'پریروز', days: -2 },
                  { label: 'شنبه گذشته', days: -4 },
                  { label: 'هفته گذشته', days: -7 },
                  { label: 'ماه گذشته', days: -30 },
                  { label: 'فصل پیش', days: -90 },
                  { label: 'سال پیش', days: -365 },
                  { label: 'امروز', days: 0 },
                  { label: 'فردا', days: 1 },
                  { label: 'پنج‌شنبه آینده', days: 4 },
                  { label: 'هفته آینده', days: 7 },
                  { label: 'ماه آینده', days: 30 },
                  { label: 'فصل آینده', days: 90 },
                  { label: 'سال آینده', days: 365 },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setTestDaysOffset(item.days)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                      testDaysOffset === item.days
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-xs text-slate-500">عبارت خروجی در رابط کاربری Odoo:</div>
            <div className="text-lg font-bold text-indigo-900 font-sans">
              {getRelativeText(testDaysOffset)}
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-200">
              <span>تاریخ شمسی:</span>
              <strong className="font-mono text-emerald-800">
                {formatNum(testJ.year)}/{formatNum(testJ.month)}/{formatNum(testJ.day)}
              </strong>
              <span className="text-slate-400">|</span>
              <span>میلادی در دیتابیس:</span>
              <strong className="font-mono text-slate-700">
                {testDate.toISOString().slice(0, 10)}
              </strong>
            </div>
          </div>
        </div>

        {/* Panel 2: Sales Pivot Table Simulation */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Table className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                ۲. جدول محوری و نمودارها (Pivot Table & Graphs Group-by)
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setPivotGrain('month')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  pivotGrain === 'month' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ماهانه (:month)
              </button>
              <button
                onClick={() => setPivotGrain('week')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  pivotGrain === 'week' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                هفتگی (:week)
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            در ماژول زروان، گروه‌بندی‌های ماهانه و هفتگی در جدول محوری (Pivot) و نمودارها به جای ماه‌ها و هفته‌های میلادی، مستقیماً اسامی و شماره هفته‌های شمسی را نمایش می‌دهند:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-2.5 font-bold">
                    {pivotGrain === 'month' ? 'ماه سفارش (Order Date: Month)' : 'هفته سفارش (Order Date: Week)'}
                  </th>
                  <th className="p-2.5 font-bold">تعداد فاکتور</th>
                  <th className="p-2.5 font-bold">جمع کل فروش (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPivotData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold text-emerald-900">
                      {calendarMode === 'both' ? (
                        <span>
                          {row.label}{' '}
                          <span className="text-[10px] text-slate-400">({row.gregorian_equiv})</span>
                        </span>
                      ) : calendarMode === 'gregorian' ? (
                        row.gregorian_equiv
                      ) : (
                        row.label
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-slate-700">{formatNum(row.orders_count)}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      {formatNum(row.total_sales.toLocaleString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panel 3: Universal Excel / CSV Import Engine Tester */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 space-x-reverse">
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              ۳. شبیه‌ساز ایمپورت فایل‌های اکسل و CSV در تمام ماژول‌های Odoo
            </h3>
          </div>
          <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-mono">
            base_import.import._parse_date_from_data
          </span>
        </div>

        <p className="text-xs text-slate-500">
          هنگام ایمپورت فایل اکسل مشتریان، سفارشات یا محصولات، تاریخ‌های شمسی به طور خودکار به میلادی برای ذخیره امن در دیتابیس ترجمه می‌شوند:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              محتوای فایل اکسل ورودی (شامل تاریخ‌های شمسی):
            </label>
            <textarea
              rows={5}
              value={excelInput}
              onChange={(e) => setExcelInput(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              پیش‌نمایش ذخیره‌سازی در دیتابیس PostgreSQL (تماماً میلادی و امن):
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 text-xs">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-200/70 text-slate-700">
                    <th className="p-2 font-bold">مشتری</th>
                    <th className="p-2 font-bold text-amber-900">تاریخ در اکسل</th>
                    <th className="p-2 font-bold text-emerald-900">ذخیره در دیتابیس</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-mono">
                  {parsedRows.slice(1).map((r: any, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2 font-sans font-medium text-slate-900">{r.col1}</td>
                      <td className="p-2 text-amber-700">{r.rawDate}</td>
                      <td className="p-2 text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{r.convertedG}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 4: Odoo Documents Spreadsheet & Formulas */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Calculator className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              ۴. توابع و محاسبات تاریخ در اسپردشیت Odoo (Documents Spreadsheet / o-spreadsheet)
            </h3>
          </div>
          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-mono">
            o-spreadsheet / JDATE, JEDATE, JEOMONTH
          </span>
        </div>

        <p className="text-xs text-slate-500">
          در اکسل داخلی Odoo (Documents Spreadsheet)، افزونه زروان توابع اختصاصی تقویم جلالی را ثبت می‌کند. همچنین محاسبات جمع و تفریق روز (مانند A1 + 10) با فرمت شمسی سلول هماهنگ است:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800">توابع اختصاصی تقویم جلالی ثبت‌شده:</h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-purple-700">=JDATE(1405, 1, 15)</span>
                <span className="text-[11px] text-slate-500 block font-sans">
                  ساخت سریال تاریخ معادل ۱۵ فروردین ۱۴۰۵
                </span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-purple-700">=JEDATE(A1, 3)</span>
                <span className="text-[11px] text-slate-500 block font-sans">
                  افزودن ۳ ماه شمسی بر اساس تقویم خورشیدی ایران
                </span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-purple-700">=JEOMONTH(A1, 0)</span>
                <span className="text-[11px] text-slate-500 block font-sans">
                  محاسبه دقیق آخرین روز ماه شمسی (۳۱ روز نیمه اول، ۳۰ روز نیمه دوم، ۲۹/۳۰ اسفند)
                </span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-purple-700">=A1 + 15</span>
                <span className="text-[11px] text-slate-500 block font-sans">
                  جمع روز با تاریخ: به طور طبیعی ۱۵ روز تقویمی اضافه می‌شود و نتیجه به صورت شمسی نمایش می‌یابد.
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-purple-900">تست زنده محاسبات تاریخ در اسپردشیت:</h4>
            <div className="text-xs space-y-2 font-mono">
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100">
                <span className="text-slate-600">تاریخ پایه سلول A1:</span>
                <span className="font-bold text-purple-900">۱۴۰۵/۰۱/۱۵</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100">
                <span className="text-slate-600">=A1 + 10 (افزودن ۱۰ روز):</span>
                <span className="font-bold text-emerald-700">۱۴۰۵/۰۱/۲۵ (2026-04-14)</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100">
                <span className="text-slate-600">=JEDATE(A1, 2) (+۲ ماه):</span>
                <span className="font-bold text-emerald-700">۱۴۰۵/۰۳/۱۵ (2026-06-05)</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100">
                <span className="text-slate-600">=JEOMONTH(A1, 0) (آخر ماه):</span>
                <span className="font-bold text-emerald-700">۱۴۰۵/۰۱/۳۱ (۳۱ فروردین)</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100">
                <span className="text-slate-600">=JMONTHNAME(A1):</span>
                <span className="font-bold text-indigo-700 font-sans">«فروردین»</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 5: Live Odoo 20 Views & QWeb Invoice Preview (Zero-XML UI Interception) */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Eye className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              ۵. پیش‌نمایش زنده نمای لیست (List/Tree) و فاکتور چاپی QWeb بر اساس حالت کاربر
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">حالت کنونی نمایش:</span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              calendarMode === 'both' ? 'bg-indigo-100 text-indigo-800' :
              calendarMode === 'gregorian' ? 'bg-blue-100 text-blue-800' :
              'bg-emerald-100 text-emerald-800'
            }`}>
              {calendarMode === 'both' ? 'هر دو (شمسی + میلادی)' : calendarMode === 'gregorian' ? 'میلادی استاندارد' : 'فقط خورشیدی (شمسی)'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          جدول زیر شبیه‌سازی دقیق خروجی ماژول زروان در نمای لیست سفارشات فروش (Sales Orders List View) و فاکتور چاپی QWeb است:
        </p>

        {/* Simulated Odoo 20 List View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">شماره سفارش</th>
                <th className="p-2.5">مشتری</th>
                <th className="p-2.5 text-emerald-800 bg-emerald-50/50">تاریخ سفارش (Order Date)</th>
                <th className="p-2.5 text-emerald-800 bg-emerald-50/50">سررسید تحویل (Due Date)</th>
                <th className="p-2.5">مبلغ کل (ریال)</th>
                <th className="p-2.5">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { ref: 'SO00142', customer: 'شرکت پتروشیمی زاگرس', jDate: '1405/01/15', gDate: '2026-04-04', jDue: '1405/01/30', gDue: '2026-04-19', amount: '840,000,000', status: 'سفارش فروش' },
                { ref: 'SO00143', customer: 'فولاد مبارکه اصفهان', jDate: '1405/01/19', gDate: '2026-04-08', jDue: '1405/02/18', gDue: '2026-05-08', amount: '1,450,000,000', status: 'ارسال شده' },
                { ref: 'SO00144', customer: 'داروسازی سینا داروی پارس', jDate: '1405/01/25', gDate: '2026-04-14', jDue: '1405/02/09', gDue: '2026-04-29', amount: '320,000,000', status: 'پیش‌فاکتور' },
              ].map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  <td className="p-2.5 font-mono font-bold text-indigo-700">{row.ref}</td>
                  <td className="p-2.5 font-medium text-slate-900">{row.customer}</td>
                  <td className="p-2.5 font-mono bg-emerald-50/30 font-semibold">
                    {calendarMode === 'both' ? (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-900 font-bold">{formatNum(row.jDate)}</span>
                        <span className="text-slate-500 font-sans text-[11px]">({row.gDate})</span>
                      </span>
                    ) : calendarMode === 'gregorian' ? (
                      <span className="text-blue-700 font-medium">{row.gDate}</span>
                    ) : (
                      <span className="text-emerald-800 font-bold">{formatNum(row.jDate)}</span>
                    )}
                  </td>
                  <td className="p-2.5 font-mono bg-emerald-50/30">
                    {calendarMode === 'both' ? (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-900 font-bold">{formatNum(row.jDue)}</span>
                        <span className="text-slate-500 font-sans text-[11px]">({row.gDue})</span>
                      </span>
                    ) : calendarMode === 'gregorian' ? (
                      <span className="text-blue-700 font-medium">{row.gDue}</span>
                    ) : (
                      <span className="text-emerald-800 font-bold">{formatNum(row.jDue)}</span>
                    )}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-800">{formatNum(row.amount)}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* QWeb Invoice PDF Header Preview */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-rose-600" />
              پیش‌نمایش سربرگ فاکتور چاپی QWeb (Invoice PDF Header)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">ir.qweb.field.date</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">شماره فاکتور:</span>
              <strong className="font-mono text-slate-900">INV/2026/00142</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">تاریخ صدور فاکتور:</span>
              <strong className="font-mono text-emerald-800">
                {calendarMode === 'both' ? `${formatNum('1405/01/15')} (2026-04-04)` : calendarMode === 'gregorian' ? '2026-04-04' : formatNum('1405/01/15')}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">مهلت پرداخت (Due Date):</span>
              <strong className="font-mono text-emerald-800">
                {calendarMode === 'both' ? `${formatNum('1405/01/30')} (2026-04-19)` : calendarMode === 'gregorian' ? '2026-04-19' : formatNum('1405/01/30')}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">دوره مالیاتی:</span>
              <strong className="text-indigo-800">سه‌ماهه اول ۱۴۰۵ (بهار)</strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
