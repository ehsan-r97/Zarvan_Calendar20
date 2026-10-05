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
  parseDateString,
  toLatinDigits,
} from '../lib/jalaali';
import { UserPreferences } from '../data/holidays';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';

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
  placeholder = '1405/01/01',
  label = 'ویجت انتخاب تاریخ جلالی (OWL 3 - Odoo 20 Component)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const [typedInput, setTypedInput] = useState<string>(
    value
      ? `${initJ.year}/${String(initJ.month).padStart(2, '0')}/${String(initJ.day).padStart(2, '0')}`
      : ''
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

  const handleSelectDay = (day: number, y = currentYear, m = currentMonth) => {
    const newJalali = { year: y, month: m, day };
    setSelectedJalali(newJalali);
    const jStr = `${y}/${String(m).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    setTypedInput(jStr);

    const greg = jalaaliToGregorian(y, m, day);
    if (greg && onChange) {
      const gStr = `${greg.year}-${String(greg.month).padStart(2, '0')}-${String(greg.day).padStart(2, '0')}`;
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

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Keyboard typing with automatic slash formatting and English digits
  const handleInputChange = (raw: string) => {
    const cleanDigits = toLatinDigits(raw.replace(/[^\d/]/g, ''));
    setTypedInput(cleanDigits);

    // If matches 8 digits continuous (14050115) or standard format, parse it immediately
    const parsed = parseDateString(cleanDigits);
    if (parsed && parsed.isJalali) {
      setCurrentYear(parsed.year);
      setCurrentMonth(parsed.month);
      setSelectedJalali({ year: parsed.year, month: parsed.month, day: parsed.day });
      if (onChange) {
        onChange(parsed.gregorian, parsed.jalali);
      }
    }
  };

  const selectedGreg = selectedJalali
    ? jalaaliToGregorian(selectedJalali.year, selectedJalali.month, selectedJalali.day)
    : null;

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>}

      {/* Input container */}
      <div className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition">
        <div className="flex items-center space-x-2.5 space-x-reverse flex-1">
          <CalendarIcon
            className="w-4 h-4 text-emerald-600 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          />
          <input
            ref={inputRef}
            type="text"
            dir="ltr"
            value={typedInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full font-mono text-xs font-bold text-slate-800 bg-transparent outline-none tracking-wider"
          />
        </div>

        {selectedGreg && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md" dir="ltr">
              {selectedGreg.year}-{String(selectedGreg.month).padStart(2, '0')}-{String(selectedGreg.day).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2">
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
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
                    {m.name}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-transparent hover:bg-slate-100 px-1.5 py-0.5 rounded-md outline-none cursor-pointer font-mono"
              >
                {Array.from({ length: 25 }, (_, i) => 1395 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
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
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
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
              const weekday = (firstDayWeekday + i) % 7;
              const isFriday = weekday === 6;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`p-2 rounded-lg font-medium transition flex items-center justify-center relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'border border-emerald-500 text-emerald-700 bg-emerald-50 font-bold'
                      : isFriday
                      ? 'hover:bg-rose-50 text-rose-600 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {day}
                  {isSelected && <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Footer Bar: Just Today & Clear */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const today = getCurrentJalaaliDate();
                setCurrentYear(today.year);
                setCurrentMonth(today.month);
                handleSelectDay(today.day, today.year, today.month);
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <span>امروز</span>
              <span className="font-mono text-[11px] text-emerald-600">
                ({initialCurrent.year}/{String(initialCurrent.month).padStart(2, '0')}/{String(initialCurrent.day).padStart(2, '0')})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedJalali(null);
                setTypedInput('');
                if (onChange) onChange('', '');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-rose-600 transition"
            >
              پاک کردن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
