import React, { useState } from 'react';
import { CompanySetting, UserPreferences } from '../data/holidays';
import { Building2, Settings, UserCheck, Check, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  companies: CompanySetting[];
  preferences: UserPreferences;
  onUpdateCompany: (company: CompanySetting) => Promise<void>;
  onUpdatePreferences: (preferences: UserPreferences) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  companies,
  preferences,
  onUpdateCompany,
  onUpdatePreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'user'>('company');
  const [selectedCompId, setSelectedCompId] = useState<number>(companies[0]?.id || 1);

  const currentComp = companies.find((c) => c.id === selectedCompId) || companies[0];

  // Company Edit State
  const [weekendType, setWeekendType] = useState(currentComp.jalali_weekend_type);
  const [weekendCustom, setWeekendCustom] = useState(currentComp.jalali_weekend_custom);
  const [fiscalMonth, setFiscalMonth] = useState(currentComp.fiscal_year_start_month);
  const [compSaved, setCompSaved] = useState(false);

  // User Preferences State
  const [calendarMode, setCalendarMode] = useState(preferences.calendar_mode || 'shamsi');
  const [dateFormat, setDateFormat] = useState(preferences.date_format);
  const [showGregorian, setShowGregorian] = useState(preferences.show_gregorian);
  const [usePersianNum, setUsePersianNum] = useState(preferences.use_persian_numbers);
  const [defaultView, setDefaultView] = useState(preferences.default_view);
  const [userSaved, setUserSaved] = useState(false);

  const handleCompanyChange = (id: number) => {
    setSelectedCompId(id);
    const c = companies.find((x) => x.id === id);
    if (c) {
      setWeekendType(c.jalali_weekend_type);
      setWeekendCustom(c.jalali_weekend_custom);
      setFiscalMonth(c.fiscal_year_start_month);
    }
  };

  const handleSaveCompany = async () => {
    await onUpdateCompany({
      ...currentComp,
      jalali_weekend_type: weekendType,
      jalali_weekend_custom: weekendCustom,
      fiscal_year_start_month: fiscalMonth,
    });
    setCompSaved(true);
    setTimeout(() => setCompSaved(false), 2000);
  };

  const handleSaveUserPrefs = async () => {
    await onUpdatePreferences({
      calendar_mode: calendarMode,
      date_format: dateFormat,
      show_gregorian: showGregorian,
      use_persian_numbers: usePersianNum,
      default_view: defaultView,
    });
    setUserSaved(true);
    setTimeout(() => setUserSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              تنظیمات شرکت‌ها و ترجیحات کاربری (Odoo Zarvan Configurations)
            </h2>
            <p className="text-xs text-slate-500">
              تنظیم تقویم کاری چند شرکتی، روزهای آخر هفته، سال مالی و فرمت‌های نمایش تاریخ
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'company' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تنظیمات شرکت‌ها (res.company)
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'user' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ترجیحات کاربر (res.users)
          </button>
        </div>
      </div>

      {activeTab === 'company' ? (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900 text-sm">انتخاب شرکت جهت ویرایش:</span>
            </div>
            <select
              value={selectedCompId}
              onChange={(e) => handleCompanyChange(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 outline-none cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Weekend Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                الگوی روزهای تعطیل پایان هفته (Weekend Type)
              </label>
              <select
                value={weekendType}
                onChange={(e) => setWeekendType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
              >
                <option value="thu_fri">پنج‌شنبه و جمعه (استاندارد ایران)</option>
                <option value="friday">فقط جمعه (مشاغل خدماتی و دولتی)</option>
                <option value="custom">سفارشی (کد روزهای هفته)</option>
              </select>
            </div>

            {/* Custom Weekend Days if selected */}
            {weekendType === 'custom' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  کد روزهای تعطیل (0=شنبه تا 6=جمعه)
                </label>
                <input
                  type="text"
                  value={weekendCustom}
                  onChange={(e) => setWeekendCustom(e.target.value)}
                  placeholder="مثال: 0,1 برای شنبه و یکشنبه"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono outline-none text-xs"
                />
              </div>
            )}

            {/* Fiscal Year Start */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                ماه شروع سال مالی (Fiscal Year Start Month)
              </label>
              <select
                value={fiscalMonth}
                onChange={(e) => setFiscalMonth(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
              >
                <option value={1}>فروردین (شروع بهار - تقویم رسمی)</option>
                <option value={7}>مهر (شروع پاییز - سال آموزشی/کشاورزی)</option>
                <option value={10}>دی (شروع ژانویه - بین‌الملل)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              این تنظیمات بلافاصله بر روی محاسبات روزهای کاری اثر می‌گذارند.
            </span>
            <button
              onClick={handleSaveCompany}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {compSaved ? <Check className="w-4 h-4 text-emerald-200" /> : null}
              <span>{compSaved ? 'ذخیره شد' : 'ذخیره تغییرات شرکت'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* User Preferences */
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 space-x-reverse">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900 text-sm">ترجیحات کاربر جاری (res.users):</span>
            </div>
          </div>

          {/* Calendar Display Mode Selector (Shamsi / Gregorian / Both) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="block font-bold text-slate-900 text-xs">
              حالت نمایش تقویم در رابط کاربری و گزارش‌ها (Calendar Display Mode)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label
                className={`flex items-start space-x-2 space-x-reverse p-3 rounded-xl border cursor-pointer transition ${
                  calendarMode === 'shamsi'
                    ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="calendarMode"
                  value="shamsi"
                  checked={calendarMode === 'shamsi'}
                  onChange={() => setCalendarMode('shamsi')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="block font-bold">فقط شمسی (Shamsi)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                    1405/01/01
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start space-x-2 space-x-reverse p-3 rounded-xl border cursor-pointer transition ${
                  calendarMode === 'both'
                    ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="calendarMode"
                  value="both"
                  checked={calendarMode === 'both'}
                  onChange={() => setCalendarMode('both')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="block font-bold">هر دو همزمان (Both)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                    1405/01/01 (2026-03-21)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start space-x-2 space-x-reverse p-3 rounded-xl border cursor-pointer transition ${
                  calendarMode === 'gregorian'
                    ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="calendarMode"
                  value="gregorian"
                  checked={calendarMode === 'gregorian'}
                  onChange={() => setCalendarMode('gregorian')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="block font-bold">فقط میلادی (Gregorian)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                    2026-03-21
                  </span>
                </div>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * این تنظیم مستقیماً در فیلد <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">jalali_calendar_mode</code> کاربر Odoo ذخیره شده و در تمام نماها، جداول و چاپ فاکتورها اعمال می‌گردد.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Date format */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                قالب نمایش تاریخ خورشیدی (Date Format)
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
              >
                <option value="YYYY/MM/DD">YYYY/MM/DD (مثال: 1405/01/01)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (مثال: 1405-01-01)</option>
                <option value="YYYYMMDD">YYYYMMDD (مثال: 14050101)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY (مثال: 01-01-1405)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (مثال: 01/01/1405)</option>
              </select>
            </div>

            {/* Default view */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                نمای پیش‌فرض تقویم
              </label>
              <select
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
              >
                <option value="jalali">تقویم جلالی (خورشیدی)</option>
                <option value="gregorian">تقویم گرگوری (میلادی)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={showGregorian}
                onChange={(e) => setShowGregorian(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span className="font-semibold text-slate-800">
                نمایش تاریخ میلادی در کنار تاریخ شمسی در خانه‌های تقویم
              </span>
            </label>

            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={usePersianNum}
                onChange={(e) => setUsePersianNum(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span className="font-semibold text-slate-800">
                استفاده از اعداد فارسی (۰، ۱، ۲، ...) در نمایش تاریخ‌ها
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              این ترجیحات برای کاربری شما در این محیط ذخیره می‌گردد.
            </span>
            <button
              onClick={handleSaveUserPrefs}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {userSaved ? <Check className="w-4 h-4 text-emerald-200" /> : null}
              <span>{userSaved ? 'ذخیره شد' : 'ذخیره ترجیحات'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
