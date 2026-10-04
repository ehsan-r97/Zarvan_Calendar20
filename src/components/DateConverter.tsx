import React, { useState } from 'react';
import {
  jalaaliToGregorian,
  gregorianToJalaali,
  parseDateString,
  toPersianDigits,
  isLeapYear,
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  getJalaaliWeekday,
  getCurrentJalaaliDate,
} from '../lib/jalaali';
import { ArrowLeftRight, Check, Copy, Sparkles, AlertCircle } from 'lucide-react';

export const DateConverter: React.FC = () => {
  const current = getCurrentJalaaliDate();

  // Jalali to Gregorian state
  const [jYear, setJYear] = useState<number>(current.year);
  const [jMonth, setJMonth] = useState<number>(current.month);
  const [jDay, setJDay] = useState<number>(current.day);

  // Gregorian to Jalali state
  const [gYear, setGYear] = useState<number>(2026);
  const [gMonth, setGMonth] = useState<number>(10);
  const [gDay, setGDay] = useState<number>(4);

  // Smart String Parser state
  const [testString, setTestString] = useState<string>('1405/01/01');
  const [copied, setCopied] = useState<string | null>(null);

  // Bulk convert state
  const [bulkInput, setBulkInput] = useState<string>(
    '1404-06-17\n1405/01/01\n2026-10-04\n1405-11-22\n2027-03-21'
  );

  const jToGResult = jalaaliToGregorian(jYear, jMonth, jDay);
  const gToJResult = gregorianToJalaali(gYear, gMonth, gDay);
  const parsedResult = parseDateString(testString);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getBulkResults = () => {
    const lines = bulkInput.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const p = parseDateString(line);
      return {
        input: line.trim(),
        parsed: p,
      };
    });
  };

  const jWeekdayIndex = jToGResult ? getJalaaliWeekday(jYear, jMonth, jDay) : 0;
  const gWeekdayIndex = gToJResult ? getJalaaliWeekday(gToJResult.year, gToJResult.month, gToJResult.day) : 0;

  return (
    <div className="space-y-6">
      {/* 2-Column Main Converters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Jalali to Gregorian */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">تبدیل شمسی (جلالی) به میلادی</h3>
                <p className="text-xs text-slate-500">الگوریتم دقیق خیام-بیرشک ۳۳ ساله و ۲۸۲۰ ساله</p>
              </div>
            </div>
            {isLeapYear(jYear) && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">
                سال کبیسه
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">سال شمسی</label>
              <input
                type="number"
                value={jYear}
                onChange={(e) => setJYear(parseInt(e.target.value, 10) || 1400)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ماه</label>
              <select
                value={jMonth}
                onChange={(e) => setJMonth(parseInt(e.target.value, 10))}
                className="w-full px-2 py-2 border border-slate-300 rounded-xl text-xs text-center focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
              >
                {PERSIAN_MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">روز</label>
              <input
                type="number"
                min={1}
                max={31}
                value={jDay}
                onChange={(e) => setJDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Result card */}
          {jToGResult ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <span className="text-xs font-medium text-emerald-800 block">نتیجه معادل میلادی (Gregorian):</span>
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-950">
                  {jToGResult.year}-{String(jToGResult.month).padStart(2, '0')}-{String(jToGResult.day).padStart(2, '0')}
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      `${jToGResult.year}-${String(jToGResult.month).padStart(2, '0')}-${String(jToGResult.day).padStart(2, '0')}`,
                      'j2g'
                    )
                  }
                  className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 transition"
                >
                  {copied === 'j2g' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>کپی</span>
                </button>
              </div>
              <p className="text-xs text-emerald-700 pt-1">
                روز هفته: <span className="font-semibold">{PERSIAN_WEEKDAYS[jWeekdayIndex].name}</span> ({PERSIAN_WEEKDAYS[jWeekdayIndex].english})
              </p>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>تاریخ شمسی نامعتبر است (کنترل روزهای ماه و سال کبیسه).</span>
            </div>
          )}
        </div>

        {/* Box 2: Gregorian to Jalali */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">تبدیل میلادی به شمسی (جلالی)</h3>
                <p className="text-xs text-slate-500">پشتیبانی دقیق از تقویم گرگوری با خطای صفر روز</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">سال میلادی</label>
              <input
                type="number"
                value={gYear}
                onChange={(e) => setGYear(parseInt(e.target.value, 10) || 2026)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ماه (1-12)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={gMonth}
                onChange={(e) => setGMonth(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">روز (1-31)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={gDay}
                onChange={(e) => setGDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Result card */}
          {gToJResult ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <span className="text-xs font-medium text-blue-800 block">نتیجه معادل خورشیدی (Jalali):</span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-blue-950">
                    {gToJResult.year}/{String(gToJResult.month).padStart(2, '0')}/{String(gToJResult.day).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-blue-700 block mt-0.5">
                    {gToJResult.day} {PERSIAN_MONTHS[gToJResult.month - 1].name} {gToJResult.year}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `${gToJResult.year}/${String(gToJResult.month).padStart(2, '0')}/${String(gToJResult.day).padStart(2, '0')}`,
                      'g2j'
                    )
                  }
                  className="px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs text-blue-700 hover:bg-blue-100 flex items-center gap-1 transition"
                >
                  {copied === 'g2j' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>کپی</span>
                </button>
              </div>
              <p className="text-xs text-blue-700 pt-1">
                روز هفته: <span className="font-semibold">{PERSIAN_WEEKDAYS[gWeekdayIndex].name}</span>
              </p>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>تاریخ میلادی نامعتبر است.</span>
            </div>
          )}
        </div>
      </div>

      {/* Smart String Parser / Auto-Detection Section */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-slate-900">تشخیص خودکار و پارس رشته تاریخ (detect_and_parse_date)</h3>
            <p className="text-xs text-slate-500">
              تشخیص خودکار نوع تاریخ شمسی یا میلادی براساس مقدار سال (&lt;1500 = شمسی، &gt;1900 = میلادی)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="مثال: 1405-01-01 یا 2026/10/04 یا ۱۴۰۴/۰۶/۱۷"
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {['1405/1/1', '14050115', '۱۴۰۵/۱/۱', '1405/01/01', '2026-10-04'].map((sample) => (
              <button
                key={sample}
                onClick={() => setTestString(sample)}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono transition"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {parsedResult ? (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs text-purple-600 block">فرمت تشخیص داده شده:</span>
              <span className="font-semibold text-purple-900 mt-1 block">
                {parsedResult.isJalali ? 'تقویم خورشیدی (Jalali)' : 'تقویم میلادی (Gregorian)'}
              </span>
            </div>
            <div>
              <span className="text-xs text-purple-600 block">تاریخ شمسی:</span>
              <span className="font-semibold font-mono text-purple-900 mt-1 block">
                {parsedResult.jalali}
              </span>
            </div>
            <div>
              <span className="text-xs text-purple-600 block">تاریخ میلادی:</span>
              <span className="font-semibold font-mono text-purple-900 mt-1 block">
                {parsedResult.gregorian}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-xl">
            رشته تاریخ معتبر وارد کنید (الگو: YYYY-MM-DD یا YYYY/MM/DD).
          </div>
        )}
      </div>

      {/* Batch Date Converter (Like Odoo Import Wizard) */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-base">تبدیل دسته‌ای تاریخ‌ها (Batch / Excel Import Tester)</h3>
        <p className="text-xs text-slate-500">
          چندین تاریخ را خط به خط وارد کنید تا به صورت همزمان تبدیل و اعتبارسنجی شوند:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ورودی تاریخ‌ها (هر خط یک تاریخ):</label>
            <textarea
              rows={6}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نتایج تبدیل دسته‌ای:</label>
            <div className="border border-slate-200 rounded-xl max-h-[160px] overflow-y-auto divide-y divide-slate-100 bg-slate-50">
              {getBulkResults().map((item, idx) => (
                <div key={idx} className="p-2 text-xs flex items-center justify-between">
                  <span className="font-mono text-slate-700">{item.input}</span>
                  {item.parsed ? (
                    <div className="flex items-center space-x-2 space-x-reverse text-slate-600 font-mono">
                      <span className="text-emerald-700 font-bold">{item.parsed.jalali}</span>
                      <span>⇄</span>
                      <span className="text-blue-700">{item.parsed.gregorian}</span>
                    </div>
                  ) : (
                    <span className="text-rose-500 text-[11px]">نامعتبر</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
