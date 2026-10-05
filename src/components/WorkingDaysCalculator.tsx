import React, { useState, useEffect } from 'react';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  getDaysInJalaaliMonth,
  getJalaaliWeekday,
  getCurrentJalaaliDate,
  toPersianDigits,
  isLeapYear,
} from '../lib/jalaali';
import { CompanySetting, HolidayRecord, UserPreferences } from '../data/holidays';
import { Briefcase, Building2, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface WorkingDaysCalculatorProps {
  companies: CompanySetting[];
  holidays: HolidayRecord[];
  preferences: UserPreferences;
}

export const WorkingDaysCalculator: React.FC<WorkingDaysCalculatorProps> = ({
  companies,
  holidays,
  preferences,
}) => {
  const current = getCurrentJalaaliDate();

  const [selectedYear, setSelectedYear] = useState<number>(current.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(current.month);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(companies[0]?.id || 1);
  const [dailyHours, setDailyHours] = useState<number>(8);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  const daysInMonth = getDaysInJalaaliMonth(selectedYear, selectedMonth);

  const isWeekendDay = (weekdayIndex: number) => {
    if (!selectedCompany) return false;
    if (selectedCompany.jalali_weekend_type === 'friday') {
      return weekdayIndex === 6;
    } else if (selectedCompany.jalali_weekend_type === 'thu_fri') {
      return weekdayIndex === 5 || weekdayIndex === 6;
    } else if (selectedCompany.jalali_weekend_type === 'custom' && selectedCompany.jalali_weekend_custom) {
      const days = selectedCompany.jalali_weekend_custom.split(',').map((d) => parseInt(d.trim(), 10));
      return days.includes(weekdayIndex);
    }
    return false;
  };

  // Find holidays in this month
  const monthHolidays = holidays.filter((h) => {
    if (!h.is_active) return false;
    if (h.company_id && h.company_id !== selectedCompany?.id) return false;
    const yearMatches = h.jalali_year === null || h.jalali_year === selectedYear;
    return yearMatches && h.jalali_month === selectedMonth;
  });

  const holidayDaysMap = new Map<number, HolidayRecord>();
  monthHolidays.forEach((h) => holidayDaysMap.set(h.jalali_day, h));

  // Compute stats
  let weekendDays = 0;
  let nonWeekendHolidays = 0;
  let workingDays = 0;

  const daysList: {
    day: number;
    weekday: number;
    weekdayName: string;
    isWeekend: boolean;
    isHoliday: boolean;
    holidayName?: string;
    isWorkingDay: boolean;
  }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = getJalaaliWeekday(selectedYear, selectedMonth, day);
    const isWeekend = isWeekendDay(weekday);
    const holiday = holidayDaysMap.get(day);
    const isHoliday = Boolean(holiday);

    if (isWeekend) {
      weekendDays++;
    } else if (isHoliday) {
      nonWeekendHolidays++;
    } else {
      workingDays++;
    }

    daysList.push({
      day,
      weekday,
      weekdayName: PERSIAN_WEEKDAYS[weekday].name,
      isWeekend,
      isHoliday,
      holidayName: holiday?.name,
      isWorkingDay: !isWeekend && !isHoliday,
    });
  }

  const totalWorkingHours = workingDays * dailyHours;

  const formatNum = (n: number | string) => {
    return n;
  };

  const monthObj = PERSIAN_MONTHS[selectedMonth - 1];

  return (
    <div className="space-y-6">
      {/* Header filter & controls */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                محاسبه روزهای کاری ماه ({monthObj.name} {formatNum(selectedYear)})
              </h2>
              <p className="text-xs text-slate-500">
                بر اساس تنظیمات تقویم شرکت و تفکیک روزهای تعطیل رسمی و هفتگی
              </p>
            </div>
          </div>

          {/* Company Selector */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.jalali_weekend_type === 'thu_fri' ? 'پنج‌شنبه و جمعه' : c.jalali_weekend_type === 'friday' ? 'فقط جمعه' : 'سفارشی'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Hours Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">سال خورشیدی</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              {Array.from({ length: 15 }, (_, i) => 1400 + i).map((y) => (
                <option key={y} value={y}>
                  {formatNum(y)} {isLeapYear(y) ? '(کبیسه)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ماه</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              {PERSIAN_MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.latin})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ساعت کار در هر روز</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="16"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value) || 8)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-center focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedYear(current.year);
                setSelectedMonth(current.month);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
            >
              ماه جاری ({monthObj.name})
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Working Days */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-2">
            <span>روزهای کاری خالص</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-900 font-mono">
            {formatNum(workingDays)} <span className="text-sm font-normal font-vazir text-emerald-700">روز</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            {( (workingDays / daysInMonth) * 100 ).toFixed(1)}% از کل ماه
          </p>
        </div>

        {/* Working Hours */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-blue-200 bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between text-xs text-blue-800 font-semibold mb-2">
            <span>مجموع ساعات موظفی</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-900 font-mono">
            {formatNum(totalWorkingHours)} <span className="text-sm font-normal font-vazir text-blue-700">ساعت</span>
          </div>
          <p className="text-[11px] text-blue-600 mt-1">مبنا: {formatNum(dailyHours)} ساعت در روز</p>
        </div>

        {/* Weekend Days */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-rose-200 bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold mb-2">
            <span>تعطیلات هفتگی</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-900 font-mono">
            {formatNum(weekendDays)} <span className="text-sm font-normal font-vazir text-rose-700">روز</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-1">
            الگو: {selectedCompany.jalali_weekend_type === 'thu_fri' ? 'پنج‌شنبه و جمعه' : selectedCompany.jalali_weekend_type === 'friday' ? 'جمعه' : 'سفارشی'}
          </p>
        </div>

        {/* Official Holidays */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-amber-200 bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-2">
            <span>تعطیلات رسمی (غیر پایان هفته)</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-900 font-mono">
            {formatNum(nonWeekendHolidays)} <span className="text-sm font-normal font-vazir text-amber-700">روز</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1">
            {monthHolidays.length} مناسبت در ماه ({monthHolidays.length - nonWeekendHolidays} همپوشانی با آخر هفته)
          </p>
        </div>
      </div>

      {/* Detailed Month Table Matrix */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            ماتریس روزانه ماه {monthObj.name} ({formatNum(daysInMonth)} روز)
          </h3>
          <span className="text-xs text-slate-500">
            کل روزهای تعطیل: {formatNum(weekendDays + nonWeekendHolidays)} روز
          </span>
        </div>

        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">روز</th>
                <th className="py-2.5 px-4 font-semibold">روز هفته</th>
                <th className="py-2.5 px-4 font-semibold">وضعیت</th>
                <th className="py-2.5 px-4 font-semibold">مناسبت / تعطیلی</th>
                <th className="py-2.5 px-4 font-semibold">ساعت کاری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daysList.map((item) => (
                <tr
                  key={item.day}
                  className={`hover:bg-slate-50/80 transition ${
                    item.isWorkingDay ? '' : 'bg-rose-50/20'
                  }`}
                >
                  <td className="py-2 px-4 font-mono font-bold text-slate-900">
                    {formatNum(item.day)} {monthObj.name}
                  </td>
                  <td className="py-2 px-4 text-slate-700">{item.weekdayName}</td>
                  <td className="py-2 px-4">
                    {item.isWorkingDay ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        روز کاری
                      </span>
                    ) : item.isHoliday ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800">
                        تعطیل رسمی
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        تعطیل هفتگی
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-slate-600">
                    {item.holidayName || (item.isWeekend ? 'پایان هفته' : '-')}
                  </td>
                  <td className="py-2 px-4 font-mono">
                    {item.isWorkingDay ? (
                      <span className="text-emerald-700 font-semibold">{formatNum(dailyHours)} ساعت</span>
                    ) : (
                      <span className="text-slate-400">۰ ساعت</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
