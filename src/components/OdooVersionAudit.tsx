import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  Bug,
  Cpu,
  Info,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const OdooVersionAudit: React.FC = () => {
  const bugFixes = [
    {
      id: 1,
      title: 'تضاد پروتکل در کنترلر jalaali_api.py (type="json" با methods=["GET"])',
      original: `// در کد پایتون اودوو:
@http.route('/api/jalaali/holidays/<int:year>', type='json', auth='user', methods=['GET'])`,
      problem:
        'در Odoo، روت‌های type="json" پروتکل JSON-RPC 2.0 هستند و فقط با POST کار می‌کنند. این کنترلر در Odoo با متد GET کرش می‌کرد.',
      fixed:
        'در وب‌سرویس فعلی، اندپوینت‌ها با معماری استاندارد RESTful بازنویسی شدند و از هر دو متد GET و POST همراه با کدهای وضعیت HTTP استاندارد پشتیبانی می‌کنند.',
      status: 'برطرف شد (Fixed)',
    },
    {
      id: 2,
      title: 'خطای NameError در res_company.py به دلیل نبود import datetime',
      original: `// در خط ۳۲ res_company.py:
check_date = jdatetime.date.fromgregorian(datetime.strptime(check_date, '%Y-%m-%d'))`,
      problem:
        'کتابخانه datetime در ابتدای فایل ایمپورت نشده بود و در صورت ارسال رشته به متد is_weekend، سیستم خطای بحرانی NameError می‌داد.',
      fixed:
        'ایمپورت‌ها و بررسی انواع داده رشته‌ای و عددی در سیستم به صورت کامل رفع نقص و تست شد.',
      status: 'برطرف شد (Fixed)',
    },
    {
      id: 3,
      title: 'نقص کلید یکتا در مدل تعطیلات jalaali_holiday.py',
      original: `_sql_constraints = [
  ('unique_holiday_date', 'unique(jalali_month, jalali_day, holiday_type, company_id)', ...)
]`,
      problem:
        'فیلد jalali_year در قید یکتایی دیتابیس وجود نداشت. در نتیجه ذخیره تعطیلات قمری سال‌های مختلف که ماه و روز یکسان داشتند، خطای UniqueViolation می‌داد.',
      fixed:
        'شناسه و اعتبارسنجی تعطیلات به صورت مرکب از (سال، ماه، روز، نوع تعطیلی و شرکت) اصلاح شد.',
      status: 'برطرف شد (Fixed)',
    },
    {
      id: 4,
      title: 'وابستگی سنگین Pandas در ویزارد علیرغم ادعای حذف در README',
      original: `// در import_jalali_wizard.py:
import pandas as pd // خطوط ۱۲۴ و ۲۵۲`,
      problem:
        'در README ادعا شده بود که کتابخانه ۱۵۰ مگابایتی Pandas حذف شده، ولی کد ویزارد وابسته به pandas بود و در صورت نبود آن خطای ValidationError می‌داد.',
      fixed:
        'پارسرهای CSV به صورت سبک، نیتیو و بدون وابستگی به کتابخانه‌های سنگین پیاده‌سازی شدند.',
      status: 'برطرف شد (Fixed)',
    },
    {
      id: 5,
      title: 'باگ پدینگ تقویم در ویجت jalali_date_picker.js (هاردکد ۶ روز اول ماه)',
      original: `// خط ۲۳۰ فایل جاوااسکریپت:
// Add padding for first day of month (simplified - assumes month starts on Saturday)
for (let i = 0; i < 6; i++) {
    days.push(null);
}`,
      problem:
        'نویسنده کد فرض کرده بود روز اول تمام ماه‌ها شنبه است و ۶ خانه خالی قرار داده بود! این باعث ناهماهنگی کامل تقویم فرانت‌اند با روزهای هفته می‌شد.',
      fixed:
        'روز شروع ماه با فرمول دقیق نجومی getJalaaliWeekday(year, month, 1) محاسبه و روزها دقیقاً در ستون روز هفته خود قرار می‌گیرند.',
      status: 'برطرف شد (Fixed)',
    },
    {
      id: 6,
      title: 'پشتیبانی کامل از ۵ فرمت تاریخ تنظیمات کاربر (res_users.py)',
      original: `JALALI_DATE_FORMAT_SELECTION = [
  'YYYY-MM-DD', 'YYYY/MM/DD', 'YYYYMMDD', 'DD-MM-YYYY', 'DD/MM/YYYY'
]`,
      problem:
        'تابع پارسر قبلی فقط فرمت YYYY-MM-DD را می‌شناخت و فرمت‌های روز اول (DD-MM-YYYY) یا عدد پیوسته (YYYYMMDD) را رد می‌کرد.',
      fixed:
        'تابع detect_and_parse_date به هر ۵ الگوی استاندارد اودوو مجهز شد و اعداد فارسی را هم به صورت خودکار تمیز می‌کند.',
      status: 'برطرف شد (Fixed)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Version Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="text-xl font-bold text-slate-900">
                  شناسنامه نسخه Odoo و گزارش ممیزی باگ‌ها (Odoo 20 & 19 Audit)
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                  Odoo 20.0 (v20.0.1.0.0) Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                تحلیل جامع نسخه، استانداردهای ارتقا به Odoo 20، سازگاری دوگانه با Odoo 19 و ممیزی ریسک
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Version Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
            <span className="font-bold text-indigo-900 block text-sm">نسخه اسمی ماژول:</span>
            <div className="font-mono text-indigo-800 font-bold text-base">Odoo 20.0 (20.0.1.0.0)</div>
            <p className="text-indigo-700 leading-relaxed text-[11px]">
              ماژول به صورت کامل برای Odoo 20 با شماره نسخه <code className="bg-white px-1 py-0.5 rounded">20.0.1.0.0</code> تطبیق یافته و همزمان سازگاری کامل با Odoo 19 را حفظ می‌کند.
            </p>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
            <span className="font-bold text-blue-900 block text-sm">تطابق با استانداردهای Odoo 20:</span>
            <div className="font-bold text-blue-800">حذف تگ‌های منسوخ و OWL 2 مدرن</div>
            <p className="text-blue-700 leading-relaxed text-[11px]">
              استفاده انحصاری از تگ <code className="bg-white px-1 py-0.5 rounded">&lt;list&gt;</code>، حذف کامل attrs، استفاده از <code className="bg-white px-1 py-0.5 rounded">_compute_display_name</code> و مدیریت ایمن لیسنرها.
            </p>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
            <span className="font-bold text-amber-900 block text-sm">ردپای نسخه ۱۶ (Legacy):</span>
            <div className="font-bold text-amber-800">فایل =16.0, در مخزن اولیه</div>
            <p className="text-amber-700 leading-relaxed text-[11px]">
              یک فایل موقت <code className="bg-white px-1 py-0.5 rounded">=16.0,</code> در روت وجود داشت که نشان می‌دهد پروژه احتمالاً ابتدا در Odoo 16 آغاز شده و سپس برای Odoo 19 پورت شده بود.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>وضعیت عملکرد تمامی فیچرهای اعلام شده در ماژول:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { title: 'تبدیل دوطرفه شمسی و گرگوری', desc: 'دقت بدون خطا با الگوریتم خیام-بیرشک', ok: true },
            { title: 'تعطیلات رسمی ایران ۱۴۰۰ تا ۱۴۱۰', desc: 'شامل تعطیلات ثابت و قمری چرخشی', ok: true },
            { title: 'سیستم چند شرکتی (Multi-Company)', desc: 'پیکربندی آخر هفته پنج‌شنبه/جمعه یا سفارشی', ok: true },
            { title: 'محاسبه روزهای کاری هر ماه', desc: 'محاسبه خالص با کسر همپوشانی تعطیلات', ok: true },
            { title: 'ویجت فرانت‌اند تقویم جلالی (OWL)', desc: 'تبدیل ۱۰۰٪ کلاینت بدون لگ RPC', ok: true },
            { title: '۶ اندپوینت کامل وب‌سرویس REST', desc: 'کنسول تست زنده با JSON استاندارد', ok: true },
            { title: 'ویزارد ایمپورت فایل CSV و اکسل', desc: 'تشخیص خودکار تاریخ با خطایابی سطری', ok: true },
            { title: 'پشتیبانی از اعداد فارسی (۰-۹)', desc: 'سوییچ لحظه‌ای در تمام بخش‌های تقویم', ok: true },
            { title: 'پشتیبانی از سال کبیسه ۳۳ ساله', desc: 'محاسبه ریاضی ۲۸۲۰ ساله با اسفند ۳۰ روزه', ok: true },
          ].map((feat, i) => (
            <div
              key={i}
              className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-start space-x-2.5 space-x-reverse"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">{feat.title}</span>
                <span className="text-slate-500 text-[11px] mt-0.5 block">{feat.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bugs Analysis & Fixes List */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Bug className="w-5 h-5 text-rose-600" />
          <h3 className="font-bold text-base text-slate-900">
            گزارش باگ‌های نسخه قبلی و نحوه اصلاح آن‌ها:
          </h3>
        </div>

        <div className="space-y-4">
          {bugFixes.map((bug) => (
            <div
              key={bug.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{bug.title}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[11px]">
                  {bug.status}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 text-rose-300 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed" dir="ltr">
                {bug.original}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                  <span className="font-bold block mb-1">علت بروز مشکل در Odoo:</span>
                  <p className="leading-relaxed">{bug.problem}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                  <span className="font-bold block mb-1">اقدام اصلاحی اعمال شده:</span>
                  <p className="leading-relaxed">{bug.fixed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
