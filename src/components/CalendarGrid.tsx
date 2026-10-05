import React, { useState, useEffect } from 'react';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  getDaysInJalaaliMonth,
  getJalaaliWeekday,
  jalaaliToGregorian,
  getCurrentJalaaliDate,
  isLeapYear,
  formatUserDate,
} from '../lib/jalaali';
import { HolidayRecord, CompanySetting, UserPreferences } from '../data/holidays';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Info, Building2, Star } from 'lucide-react';

interface CalendarGridProps {
  currentDate: ReturnType<typeof getCurrentJalaaliDate>;
  holidays: HolidayRecord[];
  company: CompanySetting;
  preferences: UserPreferences;
  onSelectDate?: (year: number, month: number, day: number) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  holidays,
  company,
  preferences,
  onSelectDate,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.month);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    day: number;
    weekdayName: string;
    gregorian: string;
    isWeekend: boolean;
    holiday: HolidayRecord | null;
  } | null>(null);

  const daysInMonth = getDaysInJalaaliMonth(selectedYear, selectedMonth);
  const firstDayWeekday = getJalaaliWeekday(selectedYear, selectedMonth, 1);

  // Filter holidays for the selected month and year
  const monthHolidays = holidays.filter((h) => {
    if (!h.is_active) return false;
    if (h.company_id && h.company_id !== company.id) return false;
    const yearMatches = h.jalali_year === null || h.jalali_year === selectedYear;
    return yearMatches && h.jalali_month === selectedMonth;
  });

  const isWeekendDay = (weekdayIndex: number) => {
    if (company.jalali_weekend_type === 'friday') {
      return weekdayIndex === 6;
    } else if (company.jalali_weekend_type === 'thu_fri') {
      return weekdayIndex === 5 || weekdayIndex === 6;
    } else if (company.jalali_weekend_type === 'custom' && company.jalali_weekend_custom) {
      const days = company.jalali_weekend_custom.split(',').map((d) => parseInt(d.trim(), 10));
      return days.includes(weekdayIndex);
    }
    return false;
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setSelectedYear(currentDate.year);
    setSelectedMonth(currentDate.month);
  };

  const currentMonthData = PERSIAN_MONTHS[selectedMonth - 1];

  const formatNum = (num: number | string) => {
    return num;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
            <CalendarIcon className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {preferences.calendar_mode === 'gregorian'
                  ? `${currentMonthData.latin} (${currentMonthData.baseName})`
                  : preferences.calendar_mode === 'both'
                  ? `${currentMonthData.baseName} (${formatNum(currentMonthData.id)}) ${formatNum(selectedYear)} (${currentMonthData.latin})`
                  : `${currentMonthData.baseName} (${formatNum(currentMonthData.id)}) ${formatNum(selectedYear)}`}
              </h2>
              {isLeapYear(selectedYear) && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-400/20 text-amber-300 rounded-full border border-amber-300/30">
                  سال کبیسه (Leap)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/80">
              {currentMonthData.latin} • {currentMonthData.season} • {formatNum(daysInMonth)} روز
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={handleGoToToday}
            className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 transition rounded-lg text-white border border-white/15"
          >
            امروز ({formatUserDate(currentDate.year, currentDate.month, currentDate.day, preferences)})
          </button>

          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/10">
            <button
              onClick={handleNextMonth}
              title="ماه بعد"
              className="p-1.5 hover:bg-white/20 rounded-lg text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Quick Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs sm:text-sm font-medium text-white px-2 py-1 outline-none cursor-pointer text-center"
            >
              {PERSIAN_MONTHS.map((m) => (
                <option key={m.id} value={m.id} className="text-slate-900 bg-white">
                  {preferences.calendar_mode === 'gregorian'
                    ? `${m.latin} - ${m.baseName}`
                    : `${m.baseName} (${formatNum(m.id)})`}
                </option>
              ))}
            </select>

            {/* Quick Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs sm:text-sm font-medium text-white px-2 py-1 outline-none cursor-pointer text-center"
            >
              {Array.from({ length: 15 }, (_, i) => 1400 + i).map((y) => (
                <option key={y} value={y} className="text-slate-900 bg-white">
                  {formatNum(y)}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrevMonth}
              title="ماه قبل"
              className="p-1.5 hover:bg-white/20 rounded-lg text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs sm:text-sm font-semibold text-slate-700">
        {PERSIAN_WEEKDAYS.map((w) => {
          const isWeekend = isWeekendDay(w.index);
          return (
            <div
              key={w.index}
              className={`py-3 px-1 border-r border-slate-200 first:border-r-0 ${
                isWeekend ? 'text-rose-600 bg-rose-50/50' : ''
              }`}
            >
              <span className="block sm:inline">{w.name}</span>
              <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{w.english}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid Days */}
      <div className="grid grid-cols-7 border-collapse bg-slate-100/50 gap-px">
        {/* Leading empty cells for weekday offset */}
        {Array.from({ length: firstDayWeekday }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[105px] bg-slate-50/40 p-1 sm:p-2 border-slate-100" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const weekday = (firstDayWeekday + i) % 7;
          const isWeekend = isWeekendDay(weekday);
          const holiday = monthHolidays.find((h) => h.jalali_day === day);
          const isToday =
            currentDate.year === selectedYear &&
            currentDate.month === selectedMonth &&
            currentDate.day === day;

          const greg = jalaaliToGregorian(selectedYear, selectedMonth, day);
          const gregDateStr = greg ? `${greg.year}-${String(greg.month).padStart(2, '0')}-${String(greg.day).padStart(2, '0')}` : '';

          return (
            <div
              key={`day-${day}`}
              onClick={() => {
                setSelectedDayDetail({
                  day,
                  weekdayName: PERSIAN_WEEKDAYS[weekday].name,
                  gregorian: gregDateStr,
                  isWeekend,
                  holiday: holiday || null,
                });
                if (onSelectDate) onSelectDate(selectedYear, selectedMonth, day);
              }}
              className={`min-h-[64px] sm:min-h-[105px] p-1 sm:p-2 bg-white relative transition-all duration-150 hover:bg-emerald-50/60 cursor-pointer flex flex-col justify-between group ${
                isToday ? 'ring-2 ring-emerald-500 ring-inset z-10' : ''
              } ${isWeekend ? 'bg-rose-50/20' : ''}`}
            >
              {/* Day header */}
              <div className="flex items-start justify-between">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg text-xs sm:text-base font-bold transition ${
                    isToday
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : holiday
                      ? 'bg-rose-100 text-rose-700 font-extrabold'
                      : isWeekend
                      ? 'text-rose-600'
                      : 'text-slate-800 group-hover:text-emerald-700'
                  }`}
                >
                  {formatNum(day)}
                </span>

                {/* Gregorian date display */}
                {(preferences.show_gregorian || preferences.calendar_mode === 'both' || preferences.calendar_mode === 'gregorian') && greg && (
                  <span className={`text-[9px] sm:text-xs font-sans tracking-tight ${preferences.calendar_mode === 'gregorian' ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    {greg.day}
                  </span>
                )}
              </div>

              {/* Holiday indicator or Weekend badge */}
              <div className="mt-0.5 sm:mt-1 space-y-1">
                {holiday && (
                  <div
                    title={holiday.name}
                    className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-xs rounded font-medium bg-rose-500 text-white truncate shadow-xs flex items-center gap-1"
                  >
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white shrink-0 animate-pulse" />
                    <span className="truncate hidden sm:inline">{holiday.name}</span>
                    <span className="truncate sm:hidden">{holiday.name.slice(0, 7)}</span>
                  </div>
                )}

                {isWeekend && !holiday && (
                  <div className="text-[8px] sm:text-[10px] text-rose-500/80 font-medium px-0.5">
                    تعطیل
                  </div>
                )}
              </div>

              {/* Footer small marker */}
              <div className="text-[10px] text-slate-300 flex justify-between items-center pt-1 font-mono">
                {isToday && <span className="text-emerald-600 font-semibold font-vazir text-[10px]">امروز</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info & Legend */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-4 space-x-reverse flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span>امروز</span>
          </div>
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>تعطیل رسمی و مذهبی ({formatNum(monthHolidays.length)} روز)</span>
          </div>
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300" />
            <span>تعطیلات هفتگی ({company.name})</span>
          </div>
        </div>

        <div className="flex items-center text-slate-500">
          <Building2 className="w-3.5 h-3.5 ml-1 text-slate-400" />
          <span>پیکربندی آخر هفته: {company.name}</span>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDayDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedDayDetail(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CalendarIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {selectedDayDetail.weekdayName} {formatNum(selectedDayDetail.day)} {currentMonthData.name} {formatNum(selectedYear)}
                  </h3>
                  <p className="text-xs text-slate-500">جزئیات تاریخ شمسی و میلادی</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block">معادل میلادی:</span>
                <span className="font-semibold text-slate-800 font-mono mt-1 block">
                  {selectedDayDetail.gregorian}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block">وضعیت کاری:</span>
                <span
                  className={`font-semibold mt-1 block ${
                    selectedDayDetail.holiday || selectedDayDetail.isWeekend
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {selectedDayDetail.holiday
                    ? 'تعطیل رسمی'
                    : selectedDayDetail.isWeekend
                    ? 'تعطیل هفتگی'
                    : 'روز کاری'}
                </span>
              </div>
            </div>

            {selectedDayDetail.holiday && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <div className="flex items-center space-x-2 space-x-reverse font-bold text-sm">
                  <Star className="w-4 h-4 text-rose-600 fill-rose-600" />
                  <span>مناسبت: {selectedDayDetail.holiday.name}</span>
                </div>
                {selectedDayDetail.holiday.description && (
                  <p className="text-xs text-rose-700 mt-2 leading-relaxed">
                    {selectedDayDetail.holiday.description}
                  </p>
                )}
                <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-600">
                  <span>نوع: {selectedDayDetail.holiday.holiday_type === 'fixed' ? 'تعطیلی ثابت خورشیدی' : 'تعطیلی قمری (محاسباتی)'}</span>
                  <span>{selectedDayDetail.holiday.is_national ? 'تعطیل سراسری کشور' : 'تعطیل استانی/شرکتی'}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
