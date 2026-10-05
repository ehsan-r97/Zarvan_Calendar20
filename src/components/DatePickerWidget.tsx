import React, { useState, useRef, useEffect } from 'react';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  getDaysInJalaaliMonth,
  getJalaaliWeekday,
  jalaaliToGregorian,
  gregorianToJalaali,
  getCurrentJalaaliDate,
  formatDate,
  formatUserDate,
  toPersianDigits,
  isLeapYear,
} from '../lib/jalaali';
import { UserPreferences } from '../data/holidays';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Check, RefreshCw } from 'lucide-react';

interface DatePickerWidgetProps {
  value?: string; // YYYY-MM-DD (Gregorian format)
  onChange?: (gregorianDate: string, jalaliDate: string) => void;
  preferences: UserPreferences;
  placeholder?: string;
  label?: string;
}

export const DatePickerWidget: React.FC<DatePickerWidgetProps> = ({
  value,
  onChange,
  preferences,
  placeholder = 'انتخاب تاریخ شمسی...',
  label = 'ویجت انتخاب تاریخ جلالی (OWL 3 Client-Side Widget - Odoo 20)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialCurrent = getCurrentJalaaliDate();

  // If a value is supplied, convert it
  let initJ = { year: initialCurrent.year, month: initialCurrent.month, day: initialCurrent.day };
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      const gY = parseInt(parts[0], 10);
      const gM = parseInt(parts[1], 10);
      const gD = parseInt(parts[2], 10);
      const conv = gregorianToJalaali(gY, gM, gD);
      if (conv) initJ = conv;
    }
  }

  const [currentYear, setCurrentYear] = useState(initJ.year);
  const [currentMonth, setCurrentMonth] = useState(initJ.month);
  const [selectedJalali, setSelectedJalali] = useState<{ year: number; month: number; day: number } | null>(
    value ? initJ : null
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = getDaysInJalaaliMonth(currentYear, currentMonth);
  const firstDayWeekday = getJalaaliWeekday(currentYear, currentMonth, 1);

  const handleSelectDay = (day: number) => {
    const newJalali = { year: currentYear, month: currentMonth, day };
    setSelectedJalali(newJalali);

    const greg = jalaaliToGregorian(currentYear, currentMonth, day);
    if (greg && onChange) {
      const gStr = `${greg.year}-${String(greg.month).padStart(2, '0')}-${String(greg.day).padStart(2, '0')}`;
      const jStr = formatUserDate(currentYear, currentMonth, day, preferences);
      onChange(gStr, jStr);
    }
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };


  const formatNum = (num: number | string) => {
    return preferences.use_persian_numbers ? toPersianDigits(num) : num;
  };

  const displayString = selectedJalali
    ? formatUserDate(
        selectedJalali.year,
        selectedJalali.month,
        selectedJalali.day,
        preferences
      )
    : '';

  const selectedGreg = selectedJalali
    ? jalaaliToGregorian(selectedJalali.year, selectedJalali.month, selectedJalali.day)
    : null;

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>}

      {/* Input trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition"
      >
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <CalendarIcon className="w-4 h-4 text-emerald-600" />
          <span className={displayString ? 'font-medium text-slate-800' : 'text-slate-400 text-sm'}>
            {displayString || placeholder}
          </span>
        </div>

        {selectedGreg && preferences.calendar_mode === 'shamsi' && (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {selectedGreg.year}-{String(selectedGreg.month).padStart(2, '0')}-{String(selectedGreg.day).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 w-[calc(100vw-2.5rem)] max-w-xs sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 sm:p-4 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 space-x-reverse text-sm font-bold text-slate-800">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="bg-transparent hover:bg-slate-100 px-1.5 py-0.5 rounded-md outline-none cursor-pointer"
              >
                {PERSIAN_MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {preferences.calendar_mode === 'gregorian'
                      ? `${m.latin} (${m.baseName})`
                      : `${m.baseName} (${formatNum(m.id)})`}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-transparent hover:bg-slate-100 px-1.5 py-0.5 rounded-md outline-none cursor-pointer font-mono"
              >
                {Array.from({ length: 20 }, (_, i) => 1395 + i).map((y) => (
                  <option key={y} value={y}>
                    {formatNum(y)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs font-semibold text-slate-400">
            {PERSIAN_WEEKDAYS.map((w) => (
              <span key={w.index} className={w.index === 6 ? 'text-rose-500 font-bold' : ''}>
                {w.short}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <span key={`p-${i}`} className="p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedJalali &&
                selectedJalali.year === currentYear &&
                selectedJalali.month === currentMonth &&
                selectedJalali.day === day;
              const isToday =
                initialCurrent.year === currentYear &&
                initialCurrent.month === currentMonth &&
                initialCurrent.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`p-2 rounded-lg font-medium transition flex items-center justify-center relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'border border-emerald-500 text-emerald-700 bg-emerald-50'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {formatNum(day)}
                  {isSelected && <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Footer - Minimalist Today Button */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const today = getCurrentJalaaliDate();
                setCurrentYear(today.year);
                setCurrentMonth(today.month);
                handleSelectDay(today.day);
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition text-center"
            >
              امروز
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
