import React, { useState } from 'react';
import { HolidayRecord, CompanySetting, UserPreferences } from '../data/holidays';
import {
  PERSIAN_MONTHS,
  jalaaliToGregorian,
  toPersianDigits,
  getDaysInJalaaliMonth,
} from '../lib/jalaali';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Download,
} from 'lucide-react';

interface HolidaysManagerProps {
  holidays: HolidayRecord[];
  companies: CompanySetting[];
  preferences: UserPreferences;
  onAddHoliday: (holiday: Partial<HolidayRecord>) => Promise<void>;
  onDeleteHoliday: (id: string) => Promise<void>;
  onResetHolidays: () => Promise<void>;
  onImportCsv: (csvText: string, forceImport: boolean) => Promise<{ imported: number; errors: string[] }>;
}

export const HolidaysManager: React.FC<HolidaysManagerProps> = ({
  holidays,
  companies,
  preferences,
  onAddHoliday,
  onDeleteHoliday,
  onResetHolidays,
  onImportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Add Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState<string>(''); // empty = fixed every year
  const [newMonth, setNewMonth] = useState<number>(1);
  const [newDay, setNewDay] = useState<number>(1);
  const [newType, setNewType] = useState<'fixed' | 'lunar' | 'regional' | 'national'>('fixed');
  const [newIsNational, setNewIsNational] = useState(true);
  const [newDesc, setNewDesc] = useState('');
  const [formError, setFormError] = useState('');

  // Import Wizard State (like Odoo import wizard)
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvContent, setCsvContent] = useState<string>(
    `نام تعطیلی,سال,ماه,روز\nروز مهندس,1405,12,5\nروز معلم,1405,2,12\nروز پزشک,1405,6,1`
  );
  const [forceImport, setForceImport] = useState(true);
  const [importStatus, setImportStatus] = useState<{ imported: number; errors: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered list
  const filteredHolidays = holidays.filter((h) => {
    // Search
    if (searchTerm && !h.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Year filter
    if (selectedYearFilter !== 'all') {
      if (selectedYearFilter === 'fixed') {
        if (h.jalali_year !== null) return false;
      } else {
        const yNum = parseInt(selectedYearFilter, 10);
        if (h.jalali_year !== yNum && h.jalali_year !== null) return false;
      }
    }
    // Type filter
    if (selectedTypeFilter !== 'all' && h.holiday_type !== selectedTypeFilter) {
      return false;
    }
    return true;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('نام تعطیلی الزامی است.');
      return;
    }

    const y = newYear ? parseInt(newYear, 10) : null;
    const maxDay = getDaysInJalaaliMonth(y || 1405, newMonth);
    if (newDay > maxDay) {
      setFormError(`ماه انتخابی حداکثر دارای ${maxDay} روز می‌باشد.`);
      return;
    }

    try {
      await onAddHoliday({
        name: newName.trim(),
        jalali_year: y,
        jalali_month: newMonth,
        jalali_day: newDay,
        holiday_type: newType,
        is_national: newIsNational,
        description: newDesc.trim(),
      });
      setIsAddOpen(false);
      setNewName('');
      setNewDesc('');
      setNewYear('');
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت تعطیلی');
    }
  };

  const handleImportSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await onImportCsv(csvContent, forceImport);
      setImportStatus(res);
    } catch (err: any) {
      setImportStatus({ imported: 0, errors: [err.message || 'خطا در واردسازی'] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNum = (num: number | string) => {
    return num;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            بانک تعطیلات رسمی و مناسبت‌های کشور
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            شامل تعطیلات ثابت تقویم خورشیدی و تعطیلات قمری سال‌های ۱۴۰۴ تا ۱۴۱۰ (ماژول زروان)
          </p>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف تعطیلی جدید</span>
          </button>

          <button
            onClick={() => {
              setIsImportOpen(true);
              setImportStatus(null);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>واردسازی CSV / اکسل</span>
          </button>

          <button
            onClick={onResetHolidays}
            title="بازنشانی به داده‌های پیش‌فرض Odoo 19"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجوی مناسبت (مثال: نوروز، عاشورا، انقلاب)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Year Filter */}
        <div className="flex items-center space-x-1.5 space-x-reverse">
          <span className="text-xs text-slate-500">سال:</span>
          <select
            value={selectedYearFilter}
            onChange={(e) => setSelectedYearFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 outline-none cursor-pointer"
          >
            <option value="all">همه سال‌ها</option>
            <option value="fixed">فقط مناسبت‌های ثابت خورشیدی</option>
            <option value="1404">سال ۱۴۰۴</option>
            <option value="1405">سال ۱۴۰۵ (سال جاری)</option>
            <option value="1406">سال ۱۴۰۶</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-1.5 space-x-reverse">
          <span className="text-xs text-slate-500">نوع:</span>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 outline-none cursor-pointer"
          >
            <option value="all">همه انواع</option>
            <option value="fixed">ثابت تقویمی</option>
            <option value="lunar">قمری (چرخشی)</option>
            <option value="national">ملی و سراسری</option>
            <option value="regional">شرکتی یا استانی</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono mr-auto">
          {formatNum(filteredHolidays.length)} مناسبت یافت شد
        </span>
      </div>

      {/* Holidays List Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">مناسبت / تعطیلی</th>
                <th className="py-3 px-4 font-semibold">تاریخ شمسی</th>
                <th className="py-3 px-4 font-semibold">معادل میلادی (نمونه ۱۴۰۵)</th>
                <th className="py-3 px-4 font-semibold">نوع مناسبت</th>
                <th className="py-3 px-4 font-semibold">دامنه شمول</th>
                <th className="py-3 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    موردی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((h) => {
                  const effectiveYear = h.jalali_year || 1405;
                  const gDate = jalaaliToGregorian(effectiveYear, h.jalali_month, h.jalali_day);
                  const monthName = PERSIAN_MONTHS[h.jalali_month - 1]?.name;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{h.name}</div>
                        {h.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{h.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        <span className="font-bold text-slate-800">
                          {formatNum(h.jalali_day)} {monthName}
                        </span>
                        {h.jalali_year ? (
                          <span className="text-slate-500 mr-1">({formatNum(h.jalali_year)})</span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm mr-1 font-vazir">
                            هر سال
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {gDate ? `${gDate.year}-${String(gDate.month).padStart(2, '0')}-${String(gDate.day).padStart(2, '0')}` : '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            h.holiday_type === 'fixed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {h.holiday_type === 'fixed' ? 'ثابت خورشیدی' : 'محاسباتی قمری'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            h.is_national
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {h.is_national ? 'تعطیل سراسری کشور' : 'شرکتی / استانی'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onDeleteHoliday(h.id)}
                          title="حذف مناسبت"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">ثبت تعطیلی جدید</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نام تعطیلی یا مناسبت *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: روز فناوری اطلاعات"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سال خورشیدی</label>
                  <input
                    type="number"
                    placeholder="خالی = هر سال"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-center font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">خالی بگذارید تا هر سال اعمال شود</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ماه *</label>
                  <select
                    value={newMonth}
                    onChange={(e) => setNewMonth(parseInt(e.target.value, 10))}
                    className="w-full px-2 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                  >
                    {PERSIAN_MONTHS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">روز *</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newDay}
                    onChange={(e) => setNewDay(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-center font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نوع مناسبت</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                  >
                    <option value="fixed">ثابت تقویمی</option>
                    <option value="lunar">محاسباتی قمری</option>
                    <option value="regional">شرکتی / منطقه‌ای</option>
                    <option value="national">ملی و کشوری</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsNational}
                      onChange={(e) => setNewIsNational(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-semibold text-slate-700">تعطیلی رسمی سراسری</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="توضیحات تکمیلی پیرامون مناسبت..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition"
                >
                  ذخیره مناسبت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Wizard Modal (Odoo import wizard replication) */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  ویزارد واردسازی تعطیلات (CSV / Data Import Wizard)
                </h3>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              متن CSV با ستون‌های <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">نام، سال، ماه، روز</code> را درج کنید. اگر سال خالی یا خط تیره باشد، به صورت تعطیلی ثابت سالانه ذخیره می‌شود:
            </p>

            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceImport}
                  onChange={(e) => setForceImport(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-slate-700">رد کردن سطرهای نامعتبر (Force Import)</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setCsvContent(
                    `نام تعطیلی,سال,ماه,روز\nروز احسان,1405,1,15\nجشن مهرگان,-,7,10\nروز بزرگداشت سعدی,1405,2,1`
                  )
                }
                className="text-emerald-700 hover:underline"
              >
                بارگذاری نمونه تستی
              </button>
            </div>

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs space-y-1 ${
                  importStatus.errors.length === 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>تعداد {formatNum(importStatus.imported)} مناسبت با موفقیت وارد شد.</span>
                </div>
                {importStatus.errors.length > 0 && (
                  <div className="text-[11px] text-amber-700 pt-1">
                    خطاها: {importStatus.errors.join(' | ')}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
              >
                بستن
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? 'در حال واردسازی...' : 'شروع واردسازی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
