import React, { useState, useEffect } from 'react';
import {
  CalendarGrid,
} from './components/CalendarGrid';
import { DateConverter } from './components/DateConverter';
import { DatePickerWidget } from './components/DatePickerWidget';
import { WorkingDaysCalculator } from './components/WorkingDaysCalculator';
import { HolidaysManager } from './components/HolidaysManager';
import { ApiExplorer } from './components/ApiExplorer';
import { SettingsModal } from './components/SettingsModal';
import { OdooVersionAudit } from './components/OdooVersionAudit';
import { OdooLiveSimulator } from './components/OdooLiveSimulator';
import { OdooTestLab } from './components/OdooTestLab';
import { ZarvanLogo } from './components/ZarvanLogo';

import {
  INITIAL_HOLIDAYS,
  INITIAL_COMPANIES,
  INITIAL_PREFERENCES,
  HolidayRecord,
  CompanySetting,
  UserPreferences,
} from './data/holidays';
import {
  getCurrentJalaaliDate,
  toPersianDigits,
  PERSIAN_MONTHS,
  formatDate,
  formatUserDate,
  gregorianToJalaali,
} from './lib/jalaali';
import {
  Calendar as CalendarIcon,
  ArrowLeftRight,
  Briefcase,
  Layers,
  Settings,
  Terminal,
  ShieldCheck,
  Building2,
  CalendarCheck2,
  Cpu,
  Sparkles,
  Sun,
  TestTube,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'calendar' | 'testlab' | 'converter' | 'picker' | 'working_days' | 'holidays' | 'simulator' | 'api' | 'settings' | 'audit'
  >('calendar');

  const [currentDate, setCurrentDate] = useState(getCurrentJalaaliDate());
  const [holidays, setHolidays] = useState<HolidayRecord[]>(INITIAL_HOLIDAYS);
  const [companies, setCompanies] = useState<CompanySetting[]>(INITIAL_COMPANIES);
  const [activeCompanyId, setActiveCompanyId] = useState<number>(1);
  const [preferences, setPreferences] = useState<UserPreferences>(INITIAL_PREFERENCES);
  const [widgetValue, setWidgetValue] = useState<string>('2026-10-04');
  const [widgetJalaliValue, setWidgetJalaliValue] = useState<string>('1405/07/12');

  // Dynamically update formatted values whenever user preferences or date values change
  useEffect(() => {
    if (widgetValue) {
      const parts = widgetValue.split('-');
      if (parts.length === 3) {
        const j = gregorianToJalaali(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
        if (j) {
          setWidgetJalaliValue(formatUserDate(j.year, j.month, j.day, preferences));
        }
      }
    }
  }, [preferences, widgetValue]);

  // Load initial data from API or fall back to in-memory defaults
  useEffect(() => {
    async function loadData() {
      try {
        const [resHolidays, resCompanies, resPrefs, resCurrent] = await Promise.all([
          fetch('/api/jalaali/all-holidays').then((r) => r.json()),
          fetch('/api/jalaali/companies').then((r) => r.json()),
          fetch('/api/jalaali/preferences').then((r) => r.json()),
          fetch('/api/jalaali/current').then((r) => r.json()),
        ]);

        if (resHolidays.success && Array.isArray(resHolidays.data)) {
          setHolidays(resHolidays.data);
        }
        if (resCompanies.success && Array.isArray(resCompanies.data)) {
          setCompanies(resCompanies.data);
        }
        if (resPrefs.success && resPrefs.data) {
          setPreferences(resPrefs.data);
        }
        if (resCurrent.success && resCurrent.data) {
          setCurrentDate(resCurrent.data);
        }
      } catch (e) {
        console.warn('API fetch fallback to bundled initial state', e);
      }
    }
    loadData();
  }, []);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0] || INITIAL_COMPANIES[0];

  const handleAddHoliday = async (newH: Partial<HolidayRecord>) => {
    try {
      const res = await fetch('/api/jalaali/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newH),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setHolidays((prev) => [data.data, ...prev]);
      }
    } catch {
      // Fallback in-memory
      const fallbackRec: HolidayRecord = {
        id: 'c_' + Date.now(),
        name: newH.name || '',
        jalali_year: newH.jalali_year || null,
        jalali_month: newH.jalali_month || 1,
        jalali_day: newH.jalali_day || 1,
        holiday_type: newH.holiday_type || 'fixed',
        is_national: newH.is_national ?? true,
        is_active: true,
        description: newH.description,
      };
      setHolidays((prev) => [fallbackRec, ...prev]);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await fetch(`/api/jalaali/holidays/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const handleResetHolidays = async () => {
    try {
      await fetch('/api/jalaali/reset-holidays', { method: 'POST' });
    } catch (e) {
      console.warn(e);
    }
    setHolidays(INITIAL_HOLIDAYS);
    setCompanies(INITIAL_COMPANIES);
  };

  const handleImportCsv = async (csvText: string, forceImport: boolean) => {
    const res = await fetch('/api/jalaali/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText, force_import: forceImport, company_id: activeCompanyId }),
    });
    const data = await res.json();
    if (data.success) {
      // Reload all holidays
      const allRes = await fetch('/api/jalaali/all-holidays').then((r) => r.json());
      if (allRes.success) setHolidays(allRes.data);
      return { imported: data.data.imported_count, errors: data.data.errors || [] };
    }
    throw new Error(data.error || 'Failed to import CSV');
  };

  const handleUpdateCompany = async (updated: CompanySetting) => {
    try {
      await fetch(`/api/jalaali/companies/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn(e);
    }
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleUpdatePreferences = async (newPrefs: UserPreferences) => {
    try {
      await fetch('/api/jalaali/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      });
    } catch (e) {
      console.warn(e);
    }
    setPreferences(newPrefs);
  };

  const formatNum = (num: number | string) => {
    return preferences.use_persian_numbers ? toPersianDigits(num) : num;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse min-w-0">
              <ZarvanLogo size={36} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 space-x-reverse">
                  <h1 className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight truncate">
                    تقویم فارسی زروان
                  </h1>
                  <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md whitespace-nowrap hidden xs:inline-block">
                    Odoo 20
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden md:block">
                  موتور بومی تقویم جلالی، رهگیری سراسری Zero-XML، گزارش‌های رسمی QWeb و فرمول‌های اسپردشیت
                </p>
              </div>
            </div>

            {/* Header Right Status Badges (Clean & Minimalist) */}
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse shrink-0">
              {/* Active company picker */}
              <div className="hidden md:flex items-center space-x-1.5 space-x-reverse bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">شرکت:</span>
                <select
                  value={activeCompanyId}
                  onChange={(e) => setActiveCompanyId(parseInt(e.target.value, 10))}
                  className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer max-w-[120px] truncate"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Date Widget (Systray-style - Today Date Only) */}
              <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl shadow-xs">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 font-sans sm:hidden">
                      {preferences.calendar_mode === 'gregorian'
                        ? currentDate.gregorianDate
                        : preferences.calendar_mode === 'both'
                        ? `${formatNum(currentDate.day)} ${PERSIAN_MONTHS[currentDate.month - 1]?.name} (${currentDate.gregorianDate.slice(5)})`
                        : `${formatNum(currentDate.day)} ${PERSIAN_MONTHS[currentDate.month - 1]?.name}`}
                    </span>
                    <span className="text-xs font-bold text-slate-800 font-sans hidden sm:inline">
                      {preferences.calendar_mode === 'gregorian'
                        ? `امروز: ${currentDate.weekdayName}، ${currentDate.gregorianDate} (${currentDate.gregorianDate.slice(5, 7)})`
                        : preferences.calendar_mode === 'both'
                        ? `امروز: ${currentDate.weekdayName}، ${formatDate(currentDate.year, currentDate.month, currentDate.day, preferences.date_format, preferences.use_persian_numbers)} (${currentDate.gregorianDate})`
                        : `امروز: ${currentDate.weekdayName}، ${formatDate(currentDate.year, currentDate.month, currentDate.day, preferences.date_format, preferences.use_persian_numbers)}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {preferences.calendar_mode === 'gregorian'
                      ? `حالت میلادی فعال (Odoo Gregorian Mode)`
                      : preferences.calendar_mode === 'both'
                      ? `${formatDate(currentDate.year, currentDate.month, currentDate.day, preferences.date_format, preferences.use_persian_numbers)} (${currentDate.gregorianDate})`
                      : `${formatDate(currentDate.year, currentDate.month, currentDate.day, preferences.date_format, preferences.use_persian_numbers)} (شمسی)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-100/70 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 space-x-reverse overflow-x-auto py-1.5 no-scrollbar text-xs font-semibold">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>تقویم ماهانه</span>
              </button>

              <button
                onClick={() => setActiveTab('testlab')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'testlab'
                    ? 'bg-emerald-800 text-white font-bold shadow-xs'
                    : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 font-semibold border border-emerald-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>لابراتوار تست Odoo (۲۹ تست)</span>
                <span className="px-1.5 py-0.2 text-[9px] bg-emerald-600 text-white rounded font-mono">
                  Test Lab
                </span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'simulator'
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200/80 font-semibold'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>شبیه‌ساز رفتار Odoo (دیروز، فردا، Pivot)</span>
              </button>

              <button
                onClick={() => setActiveTab('converter')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'converter'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                <span>مبدل تاریخ و پارسر</span>
              </button>

              <button
                onClick={() => setActiveTab('picker')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'picker'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-600" />
                <span>ویجت انتخاب تاریخ (OWL Widget)</span>
              </button>

              <button
                onClick={() => setActiveTab('working_days')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'working_days'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-teal-600" />
                <span>محاسبه روزهای کاری</span>
              </button>

              <button
                onClick={() => setActiveTab('holidays')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'holidays'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>مدیریت تعطیلات ({formatNum(holidays.length)})</span>
              </button>

              <button
                onClick={() => setActiveTab('api')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'api'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Terminal className="w-4 h-4 text-purple-600" />
                <span>کنسول API زروان</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>تنظیمات</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'bg-purple-900 text-white font-bold shadow-xs'
                    : 'bg-purple-100/70 text-purple-900 hover:bg-purple-200/80 font-semibold'
                }`}
              >
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>نسخه Odoo، ممیزی و تست‌ها</span>
                <span className="px-1.5 py-0.2 text-[9px] bg-emerald-600 text-white rounded font-mono font-bold">
                  35 Tests
                </span>
                <span className="px-1.5 py-0.2 text-[9px] bg-purple-700 text-white rounded font-mono">
                  v20
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calendar' && (
          <CalendarGrid
            currentDate={currentDate}
            holidays={holidays}
            company={activeCompany}
            preferences={preferences}
          />
        )}

        {activeTab === 'testlab' && <OdooTestLab />}

        {activeTab === 'converter' && <DateConverter />}

        {activeTab === 'picker' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center space-x-3 space-x-reverse pb-3 border-b border-slate-100">
                <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                  <Layers className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    ویجت تعاملی فیلد تاریخ جلالی (OWL 3 Component - Odoo 20)
                  </h2>
                  <p className="text-xs text-slate-500">
                    پیاده‌سازی ماژول زروان با تبدیل ۱۰۰٪ سمت کلاینت (بدون نیاز به RPC سرور) و پشتیبانی از standardFieldProps
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                <DatePickerWidget
                  value={widgetValue}
                  preferences={preferences}
                  onChange={(gDate, jDate) => {
                    setWidgetValue(gDate);
                    setWidgetJalaliValue(jDate);
                  }}
                />

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">مقدار فیلد دیتابیس (Date Field Value):</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                      {widgetValue}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">مقدار نمایش داده شده (Formatted Jalali):</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">
                      {widgetJalaliValue}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                <h4 className="font-bold text-amber-900 mb-1">ویژگی‌های فنی این کامپوننت در Odoo:</h4>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  <li>عدم وجود لگ یا تأخیر شبکه (Zero-RPC) در هنگام تغییر روزها و ماه‌ها</li>
                  <li>حفظ وضعیت فرم با فراخوانی مستقیم <code className="font-mono bg-white/70 px-1 py-0.5 rounded">props.update()</code> بدون بروز خطا در ذخیره رکورد</li>
                  <li>محاسبه خودکار و دقیق سال‌های کبیسه ۳۳ ساله خورشیدی</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <OdooLiveSimulator
            calendarMode={preferences.calendar_mode || 'shamsi'}
            usePersianNum={preferences.use_persian_numbers}
            dateFormat={preferences.date_format}
          />
        )}

        {activeTab === 'working_days' && (
          <WorkingDaysCalculator
            companies={companies}
            holidays={holidays}
            preferences={preferences}
          />
        )}

        {activeTab === 'holidays' && (
          <HolidaysManager
            holidays={holidays}
            companies={companies}
            preferences={preferences}
            onAddHoliday={handleAddHoliday}
            onDeleteHoliday={handleDeleteHoliday}
            onResetHolidays={handleResetHolidays}
            onImportCsv={handleImportCsv}
          />
        )}

        {activeTab === 'api' && <ApiExplorer />}

        {activeTab === 'settings' && (
          <SettingsModal
            companies={companies}
            preferences={preferences}
            onUpdateCompany={handleUpdateCompany}
            onUpdatePreferences={handleUpdatePreferences}
          />
        )}

        {activeTab === 'audit' && <OdooVersionAudit />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            ماژول تقویم زروان (Zarvan Persian Calendar) • نسخه 20.0.1.0.0 (Odoo 20 Enterprise & Community)
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            توسعه‌یافته بر اساس ساختار Odoo توسط احسان رضایی (ehsan.r97@gmail.com)
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
