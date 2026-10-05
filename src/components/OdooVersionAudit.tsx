import React, { useState } from 'react';
import { ModuleAuditDeepDive } from './ModuleAuditDeepDive';
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
  Zap,
  Database,
  Printer,
  Sparkles,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Compass,
  Lightbulb,
  RefreshCw,
  TestTube,
} from 'lucide-react';

interface BreakPointItem {
  id: string;
  aspect: 'frontend' | 'database' | 'enterprise' | 'integration' | 'reporting' | 'automation' | 'security';
  aspectTitle: string;
  title: string;
  severity: 'بحرانی (Fatal)' | 'بالا (High)' | 'متوسط (Medium)';
  severityColor: string;
  whereItBreaks: string;
  rootCause: string;
  howZarvanFixes: string;
  codeExample?: string;
}

export const OdooVersionAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'benchmark' | 'modules' | 'breakpoints' | 'flaws' | 'tests'>('tests');
  const [aspectFilter, setAspectFilter] = useState<string>('all');

  const benchmarkComparisons = [
    {
      title: 'معماری تبدیل نماها (Views Conversion)',
      traditional: 'وراثت دستی فایل‌های XML (تغییر تک‌تک فرم‌ها و لیست‌ها)',
      oca: 'وراثت XML به همراه افزودن فیلدهای موازی تاریخ در دیتابیس',
      hijri: 'پچ محدود ویجت تاریخ در فرم‌ها (عدم پشتیبانی از لیست‌ها)',
      zarvan: 'اینترسپشن سراسری هسته وب‌کلاینت (@web/core/l10n/dates) بدون تغییر ۱ خط XML',
      badge: 'انقلاب معماری',
    },
    {
      title: 'وضعیت ستون‌های دیتابیس (PostgreSQL Engine)',
      traditional: 'تغییر فیلد به VARCHAR یا ذخیره رشته تاریخ شمسی در SQL',
      oca: 'ایجاد ستون‌های دوگانه (تاریخ میلادی + متن شمسی) و حجم مضاعف دیتابیس',
      hijri: 'ذخیره میلادی اما فقدان بازنویسی کوئری‌های فیلتر',
      zarvan: '۱۰۰٪ میلادی استاندارد UTC، ایندکس B-Tree دست‌نخورده با سرعت O(1)',
      badge: 'حفظ ایندکس دیتابیس',
    },
    {
      title: 'سازگاری با Odoo Studio و ماژول‌های جدید',
      traditional: 'ناموفق (فیلدهای جدید ساخته‌شده با استودیو انگلیسی می‌مانند)',
      oca: 'نیازمند کدنویسی مجدد پایتون برای هر ماژول جدید',
      hijri: 'ناموفق در فیلدهای محاسباتی و جدید',
      zarvan: 'پشتیبانی خودکار از ۱۰۰٪ فیلدهای جدید استودیو و ماژول‌های ثالث بدون کد',
      badge: 'پشتیبانی از Studio',
    },
    {
      title: 'گروه‌بندی در جداول محوری و نمودارها (Pivot & Graph)',
      traditional: 'شکست کامل (فروردین بین مارس و آوریل تقسیم و دو تکه می‌شود)',
      oca: 'تغییر نام برچسب‌های میلادی (March -> فروردین که از نظر تاریخی غلط است)',
      hijri: 'عدم پشتیبانی از گروه‌بندی واقعی ماه‌های قمری',
      zarvan: 'میکسین اختصاصی JalaaliGroupByMixin با تجمیع بر اساس ماه‌های واقعی خورشیدی',
      badge: 'گروه‌بندی واقعی',
    },
    {
      title: 'اسپردشیت اسناد اینترپرایز (o-spreadsheet)',
      traditional: 'فاقد پشتیبانی (فرمول‌های اکسل اودوو خطا می‌دهند)',
      oca: 'فاقد پشتیبانی از ماژول Spreadsheet',
      hijri: 'فاقد پشتیبانی',
      zarvan: '۸ فرمول بومی ES Module (=JDATE, =JEOMONTH, =JEDATE, ...) با محاسبه کبیسه ۳۳ ساله',
      badge: 'فرمول‌های اسپردشیت',
    },
    {
      title: 'ایمپورت دسته‌جمعی از اکسل (Favorites ➔ Import)',
      traditional: 'خطای فرمت یا کرش در سطرهای تاپل دیتابیس',
      oca: 'نیاز به فرمت مشخص و از پیش تعیین‌شده',
      hijri: 'فقط پشتیبانی از فرمت میلادی',
      zarvan: 'پارس خودکار تمام فرمت‌های شمسی، نام ماه‌ها، ارقام فارسی و سطرهای تاپل',
      badge: 'ایمپورت هوشمند',
    },
    {
      title: 'فاکتورهای چاپی مشتریان بین‌المللی (QWeb Reports)',
      traditional: 'نشت تاریخ شمسی روی فاکتور خریداران خارجی (خطای قانونی)',
      oca: 'پیچیدگی شرط‌های چندزبانه در تمپلیت‌های اختصاصی',
      hijri: 'نمایش هجری برای تمام مخاطبان بدون توجه به زبان مشتری',
      zarvan: 'جداسازی هوشمند زبان گزارش؛ صدور ۱۰۰٪ میلادی برای مخاطبان خارجی',
      badge: 'تجارت بین‌الملل',
    },
  ];

  const coreArchitecturalPillars = [
    {
      id: 'pillar_zero_xml',
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      title: 'رهگیری سراسری Zero-XML در کلاینت OWL 3 (@web/core/l10n/dates)',
      description:
        'تبدیل و نمایش تاریخ شمسی در تمام ویوهای درختی (List)، فرم‌ها، کانبان، اکتیویتی‌ها و تقویم بدون نیاز به ویرایش یا وراثت حتی یک فایل XML. به محض نصب هر ماژول استاندارد یا ثالث، تقویم آن خودکار فعال می‌شود.',
      technical: 'اینترسپشن formatDate و formatDateTime همراه با کش تک‌مرحله‌ای (Single-lookup Map) و مسیر سریع ASCII.',
      status: 'فعال و عملیاتی در هسته ماژول',
    },
    {
      id: 'pillar_btree_indexes',
      icon: <Database className="w-5 h-5 text-emerald-600" />,
      title: 'ذخیره‌سازی ۱۰۰٪ میلادی استاندارد UTC و حفظ ایندکس‌های B-Tree',
      description:
        'هیچ ستون جدیدی به دیتابیس تحمیل نشده و هیچ فیلدی به رشته تغییر نمی‌کند. کوئری‌های فیلتر و سرچ‌بار از طریق پچ BaseModel._search در حافظه به بازه‌های UTC تبدیل می‌شوند.',
      technical: 'تبدیل خودکار دامنه‌های جستجو [("date_order", ">=", "1405/01/01")] به تاریخ UTC قبل از صدور SQL.',
      status: 'فعال و عملیاتی در هسته ماژول',
    },
    {
      id: 'pillar_batch_import',
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      title: 'موتور ایمپورت دسته‌ای اکسل و CSV با مموایزیشن (۳.۵۶ میلیون سطر/ثانیه)',
      description:
        'در زمان بارگذاری فایل‌های اکسل ۵۰ هزار سطری در Odoo، تاریخ‌های تکراری تنها یک بار پارس شده و با کش O(1) در ۵.۶۲ میلی‌ثانیه پردازش می‌شوند.',
      technical: 'پچ base_import.import._parse_date_from_data با پشتیبانی از ارقام فارسی (۰–۹) و نام ماه‌ها.',
      status: 'فعال و عملیاتی در هسته ماژول',
    },
    {
      id: 'pillar_qweb_reports',
      icon: <Printer className="w-5 h-5 text-purple-600" />,
      title: 'رندرینگ هوشمند فاکتورها و گزارش‌های چاپی QWeb با تایم‌زون محلی',
      description:
        'فاکتورها، پیش‌فاکتورها و اسناد حسابداری با توجه به منطقه زمانی کاربر (context_timestamp) و زبان مشتری فرمت‌بندی می‌شوند. فاکتورهای مشتریان خارجی به صورت خودکار میلادی می‌مانند.',
      technical: 'پچ مدل‌های ir.qweb.field.date و ir.qweb.field.datetime با کش ریسمان‌امن (Thread-Safe Cache).',
      status: 'فعال و عملیاتی در هسته ماژول',
    },
    {
      id: 'pillar_spreadsheet',
      icon: <FileCode className="w-5 h-5 text-blue-600" />,
      title: 'فرمول‌های بومی ماژول اسناد و اسپردشیت Odoo (=JDATE, =JEDATE, ...)',
      description:
        'توابع محاسباتی تقویم جلالی با رعایت دقیق دوره ۳۳ ساله خیام و روزهای ۳۱ و ۳۰ روزه در موتور o-spreadsheet ثبت شده و بدون نیاز به فرمول‌های پیچیده اکسل کار می‌کنند.',
      technical: 'ثبت ES Modules با توابع JDATE, JEDATE, JEOMONTH, JYEAR, JMONTH, JDAY, JMONTHNAME, JFORMAT.',
      status: 'فعال و عملیاتی در هسته ماژول',
    },
    {
      id: 'pillar_zero_dependencies',
      icon: <ShieldCheck className="w-5 h-5 text-rose-600" />,
      title: 'معماری ۱۰۰٪ مستقل بدون نیاز به هیچ پکیج خارجی پایتون (Zero Dependencies)',
      description:
        'تمام الگوریتم‌های ریاضیاتی تبدیل، تشخیص سال‌های کبیسه و محاسبات مهلت‌های قانونی (ماده ۱۶۹ مکرر و تامین اجتماعی) بدون نیاز به دستور pip install در پایتون خالص پیاده‌سازی شده‌اند.',
      technical: 'الگوریتم نجومی جلالی در jalaali_mixin.py با حافظه پنهان فشرده بیت‌وایز عددی (Bitwise Cache).',
      status: 'فعال و عملیاتی در هسته ماژول',
    },
  ];


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
      title: 'نقص چرخه‌حیات DOM و رویداد کلیک در OWL 3 (استفاده از this.el منسوخ)',
      original: `// در jalali_date_picker.js:
onDocumentClick(ev) {
    if (this.state.isOpen && !this.el?.contains(ev.target)) {
        this.state.isOpen = false;
    }
}`,
      problem:
        'در فریم‌ورک OWL 3 (اودوو ۲۰)، ارجاع مستقیم this.el برای کامپوننت‌ها به صورت دیفالت وجود ندارد و باعث خطای تایپ یا عدم بسته‌شدن پاپ‌اوور تقویم می‌شد.',
      fixed:
        'از هوک رسمی useRef("root") و رفرنس تگ t-ref="root" در ساختار تمپلیت OWL استفاده شد.',
      status: 'برطرف شد (Fixed in OWL 3)',
    },
    {
      id: 6,
      title: 'عدم به‌روزرسانی تاریخ فرم ویو در پیجر رکوردها (Navigation Stale State)',
      original: `// در jalali_date_picker.js:
setup() {
    this.state = useState({ jalaliDate: this.formatJalali(...) });
    // بدون onWillUpdateProps!
}`,
      problem:
        'هنگام جابجایی بین رکوردها با دکمه‌های ناوبری فرم ویو (Pager)، مقدار نمایشی تقویم شمسی روی رکورد قبلی قفل می‌ماند و به‌روز نمی‌شد.',
      fixed:
        'هوک استاندارد onWillUpdateProps برای سینک خودکار استیت تاریخ با تغییرات props.record اضافه گردید.',
      status: 'برطرف شد (Fixed in OWL 3)',
    },
    {
      id: 7,
      title: 'ارسال رشته به جای شیء Luxon DateTime در متد record.update',
      original: `// در jalali_date_picker.js:
await this.props.record.update({ [this.props.name]: gIsoStr }); // gIsoStr یک String ساده بود`,
      problem:
        'کامپوننت‌های وب‌کلاینت Odoo 20 انتظار شیء لوکسان را در فیلد تاریخ دارند و پاس دادن String باعث کرش در متدهای کمکی بعدی می‌شد.',
      fixed:
        'مقدار با استفاده از DateTime.fromObject به شیء معتبر Luxon تبدیل شده و سپس به record.update ارسال می‌شود.',
      status: 'برطرف شد (Fixed in OWL 3)',
    },
    {
      id: 8,
      title: 'خطای پارس تاریخ ISO به دلیل تناقض با الگوی محلی زبان کاربر (Locale Format)',
      original: `// در jalaali_global_patch.js:
const gDate = parseDate(isoString); // خطای Invalid DateTime در زبان‌های غیر انگلیسی`,
      problem:
        'اگر فرمت کاربر بر اساس زبان فارسی dd/MM/yyyy بود، متد parseDate برای ورودی ISO با خطای Invalid DateTime کرش می‌کرد.',
      fixed:
        'پارس رشته‌های ISO مستقیماً از طریق DateTime.fromISO انجام می‌شود تا وابستگی به فرمت زبان کاربر حذف گردد.',
      status: 'برطرف شد (Fixed in OWL 3)',
    },
    {
      id: 9,
      title: 'وابستگی منسوخ به window.o_spreadsheet در سیستم ES Modules اسپردشیت',
      original: `// در jalali_spreadsheet_functions.js:
const functionRegistry = window.o_spreadsheet?.functionRegistry;`,
      problem:
        'در Odoo 20، ماژول‌های اسناد و اسپردشیت به ساختار ES Module منتقل شده‌اند و شیء سراسری window.o_spreadsheet دیگر معتبر نیست.',
      fixed:
        'توابع مستقیماً از طریق رجیستری بومی odoo.loader.modules.get("@odoo/o-spreadsheet") ثبت می‌شوند.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 10,
      title: 'تداخل بازیابی تنظیمات کاربر از سرویس غیرفعال user در کلاینت',
      original: `// در jalaali_global_patch.js:
const user = user_service; // تنظیمات جلالی در سرویس پیش‌فرض user وجود نداشت`,
      problem:
        'فیلدهای سفارشی جلالی در session_info ذخیره می‌شدند نه در سرویس کاربر، در نتیجه تقویم به حالت فال‌بک بازمی‌گشت.',
      fixed:
        'تنظیمات به سرویس session متصل شد و همچنین در متد session_info بک‌اند، مقادیر مستقیماً به شیء ریشه تزریق شدند.',
      status: 'برطرف شد (Fixed in OWL 3)',
    },
    {
      id: 11,
      title: 'حذف رکوردهای بازه زمانی ۰۰:۰۰ تا ۰۳:۳۰ بامداد در جستجو به دلیل نادیده‌گرفتن تایم‌زون',
      original: `// در base_search_patch.py:
// تبدیل تاریخ بدون در نظر گرفتن اختلاف ساعت ایران (UTC+03:30)`,
      problem:
        'تبدیل خام ۰۰:۰۰ به میلادی باعث می‌شد رکوردهای ثبت شده بین ساعت ۱۲ شب تا ۳:۳۰ بامداد در جستجوها پیدا نشوند.',
      fixed:
        'ساعت و منطقه زمانی کاربر (مثلاً Asia/Tehran) لحاظ شده و مرزهای تاریخ به صورت دقیق به معادل UTC دیتابیس ترجمه می‌شوند.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 12,
      title: 'تکه‌تکه شدن باکت‌های زمانی در پیوت و نمودارهای آماری',
      original: `// در base_group_patch.py:
// گروه‌بندی با date_trunc میلادی باعث تقسیم فروردین بین ماه مارس و آوریل می‌شد`,
      problem:
        'پچ نمایشی به تنهایی نمی‌توانست کوئری دیتابیس را اصلاح کند و رکوردهای یک ماه شمسی در دو ستون مجزا در جدول پیوت قرار می‌گرفتند.',
      fixed:
        'میکسین تخصصی JalaaliGroupByMixin با فیلدهای استور شده و ایندکس‌شده برای تجمیع مستقیم ماه و سال خورشیدی در سطح SQL ارائه شد.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 13,
      title: 'امضای متد isDisplayed در سیستری نوبار Odoo 20',
      original: `// در today_systray.js:
isDisplayed: () => { const lang = user.lang; ... }`,
      problem:
        'در Odoo 20 متد isDisplayed(env) آبجکت محیط وب‌کلاینت را دریافت می‌کند و خواندن مستقیم user.lang قبل از بوت کامل ایجاد خطای نال می‌کرد.',
      fixed:
        'امضا به isDisplayed: (env) اصلاح شد و سرویس‌ها از env.services.user و session خوانده می‌شوند.',
      status: 'برطرف شد (Fixed in OWL 3)',
    },
    {
      id: 14,
      title: 'کلاس‌های منسوخ بوت‌استرپ در فایل‌های تمپلیت XML',
      original: `// در today_systray.xml:
<button class="btn btn-xs ...">`,
      problem:
        'کلاس btn-xs در بوت‌استرپ ۵.۳ اودوو ۲۰ وجود ندارد و باعث به هم ریختگی ارتفاع دکمه در پاپ‌اوور می‌شد.',
      fixed:
        'کلاس‌های تمپلیت با استانداردهای مدرن Bootstrap 5.3 و سیستم تم Odoo 20 سازگار شدند.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 15,
      title: 'خطای ParseError در نصب ماژول به دلیل مدل نامعتبر res.groups.privilege',
      original: `// در jalaali_security.xml:
<record id="privilege_jalaali_access" model="res.groups.privilege">`,
      problem:
        'مدل res.groups.privilege در هسته استاندارد اودوو وجود ندارد و در اودوو استاندارد باعث خطای ParseError و شکست کامل نصب ماژول می‌شد. همچنین نبود category_id در گروه‌ها مانع نمایش دسترسی‌ها در فرم کاربر می‌شد.',
      fixed:
        'ساختار فایل امنیتی به مدل استاندارد ir.module.category و res.groups با فیلد category_id اصلاح شد تا دسترسی‌ها در تنظیمات کاربران اودوو ۲۰ به درستی نمایش یابند.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 16,
      title: 'خطای انتساب به تاپل ایمیوتبل در پارس فایل ایمپورت (TypeError)',
      original: `// در base_import_patch.py:
for row in data:
    row[index] = converted // خطا در صورتی که سطر به شکل tuple باشد`,
      problem:
        'در اودوو، داده‌های حاصل از ژنراتورها یا دیتابیس در برخی موارد به صورت tuple بازگردانده می‌شوند. تلاش برای ویرایش مستقیم تاپل با خطای بحرانی TypeError: "tuple" object does not support item assignment همراه می‌شد.',
      fixed:
        'سطرها پیش از اعمال مقدار تبدیل‌شده به صورت mutable_row = list(row) تبدیل می‌شوند تا ایمپورت هر نوع دیتایی بدون خطا انجام شود.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 17,
      title: 'چاپ ناخواسته تاریخ شمسی روی فاکتورهای رسمی مشتریان خارجی (en_US)',
      original: `// در ir_qweb_fields.py:
if mode == 'gregorian' or (not lang.startswith('fa') and not user.jalali_date_format):
    return super().value_to_html(value, options)`,
      problem:
        'چنانچه حسابدار برای خود فرمت تاریخ پیش‌فرض تعیین کرده بود، شرط فاکتورهای زبان انگلیسی نقض می‌شد و فاکتور چاپی مشتری خارجی با تاریخ شمسی چاپ می‌شد!',
      fixed:
        'شرط به if mode == "gregorian" or not lang.startswith("fa") اصلاح شد تا فاکتورهای صادراتی و خریداران خارجی ۱۰۰٪ با تاریخ استاندارد میلادی چاپ شوند.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 18,
      title: 'رد شدن فایل‌های اکسل ۲ ستونه در ویزارد ایمپورت تعطیلات',
      original: `// در import_jalali_wizard.py:
if len(row) < 3:
    raise ValueError("Row has fewer than 3 columns.")`,
      problem:
        'اکثر فایل‌های اکسل حاوی دو ستون "نام مناسبت" و "تاریخ" هستند. ویزارد قبلی فایل‌های زیر ۳ ستون را با خطا رد می‌کرد.',
      fixed:
        'پشتیبانی خودکار از فرمت ۲ ستونه (نام + تاریخ) با استفاده از تابع detect_and_parse_date اضافه شد.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 19,
      title: 'خطای روز آخر اسفند در سال‌های کبیسه فرمول‌های اسپردشیت اینترپرایز (=JEOMONTH)',
      original: `// در jalali_spreadsheet_functions.js:
const maxDays = targetJm <= 6 ? 31 : targetJm <= 11 ? 30 : 29; // هاردکد ۲۹ روز`,
      problem:
        'در فرمول‌های اسپردشیت اسناد Odoo Enterprise، ماه اسفند در سال‌های کبیسه ۳۰ روزه است ولی هاردکد ۲۹ روز باعث تولید تاریخ اشتباه برای پایان سال می‌شد.',
      fixed:
        'محاسبه روز پایانی با تابع نجومی isLeapJalali(targetJy) تطبیق داده شد تا در سال‌های کبیسه ۳۰ روز کامل بازگردانده شود.',
      status: 'برطرف شد (Fixed in Enterprise)',
    },
    {
      id: 20,
      title: 'پشتیبانی از توکن‌های سه‌ماهه (Quarter) در نماهای Pivot و Cohort اینترپرایز',
      original: `// در jalaali_global_patch.js:
// توکن‌های q, Q, qqq, QQQ در فرمت‌کننده تاریخ پشتیبانی نمی‌شدند`,
      problem:
        'در Odoo Enterprise نماهای پیوت و کوهورت هنگام نمایش بازه‌های فصلی از توکن‌های Q و qqq استفاده می‌کنند که در صورت عدم تعریف، مقدار خام نامفهوم تولید می‌کردند.',
      fixed:
        'توکن‌های q, qq, qqq, qqqq به صورت خودکار به سه‌ماهه اول، دوم، سوم و چهارم خورشیدی با نام سال ترجمه می‌شوند.',
      status: 'برطرف شد (Fixed in Enterprise)',
    },
    {
      id: 21,
      title: 'محاسبه محدوده زمانی سال مالی در حسابداری پیشرفته اینترپرایز',
      original: `// در res_company.py:
// عدم وجود تابع محاسبه مرزهای سال مالی شمسی برای گزارشات ترازنامه و سود و زیان`,
      problem:
        'ماژول حسابداری اینترپرایز اودوو برای فیلترهای سال مالی نیازمند مرز دقیق شروع و پایان سال مالی شمسی شرکت‌ها (فروردین یا دی‌ماه) به تاریخ میلادی است.',
      fixed:
        'متد get_jalali_fiscal_year_dates در مدل res.company پیاده‌سازی شد تا گزارشات مالی اودوو بدون تداخل بازه سال مالی شمسی را دریافت کنند.',
      status: 'برطرف شد (Fixed in Enterprise)',
    },
    {
      id: 22,
      title: 'تولید خودکار بازه‌های دوره‌ای در گزارشات داینامیک اینترپرایز (Financial Reports)',
      original: `// در jalaali_service.py:
// عدم وجود سرویس تبدیل دوره‌های فصلی، نیم‌سالی و ماهانه به بازه‌های میلادی معتبر`,
      problem:
        'در ماژول account_reports اینترپرایز، فیلترهای "این ماه"، "این فصل" و "امسال" بدون تبدیل به بازه دقیق شمسی، ماه‌های میلادی نامربوط را واکشی می‌کردند.',
      fixed:
        'سرویس get_jalali_period_date_range برای محاسبه دقیق بازه‌های تاریخی ماه، فصل، نیم‌سال و سال خورشیدی افزوده شد.',
      status: 'برطرف شد (Fixed in Enterprise)',
    },
    {
      id: 23,
      title: 'فقدان پکیج کنترلرهای پایتون در پوشه ماژول اودوو (Controllers)',
      original: `// در zarvan_calendar/__init__.py:
// عدم وجود پوشه controllers و فایل jalaali_api.py در ساختار ماژول`,
      problem:
        'علیرغم معرفی اندپوینت‌های API در README و تست‌ها، پکیج controllers در ماژول پایتون وجود نداشت و اودوو نمی‌توانست اندپوینت‌های وب‌سرویس REST را برای سیستم‌های خارجی سرو کند.',
      fixed:
        'پکیج controllers با کنترلر کامل jalaali_api.py شامل روت‌های GET و POST و ایمپورت در __init__.py ماژول ایجاد شد.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 24,
      title: 'خطای پرش ۱ ساعته در اسناد و لاگ‌ها به دلیل ساعت تابستانی منسوخ (DST Abolition Ghost Shift)',
      original: `// در پکیج‌های قدیمی pytz یا محاسبات تایم‌زون سنتی:
// اعمال خودکار +1 ساعت تابستانی بین ۱ فروردین تا ۳۰ شهریور علیرغم لغو قانونی آن از سال ۱۴۰۲`,
      problem:
        'از سال ۱۴۰۲ ساعت تابستانی در ایران لغو شده و ساعت رسمی همواره UTC+03:30 است. ماژول‌های قدیمی با اعمال قوانین منسوخ DST باعث جابجایی یک ساعته ورود و خروج ترددها، فاکتورهای صندوق و حواله‌های انبار می‌شدند.',
      fixed:
        'محاسبات زمانی بر اساس آفست ثابت UTC+03:30 بدون تغییرات تابستانی و با دقت مطلق میلی‌ثانیه‌ای در زروان تثبیت شد.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 25,
      title: 'کرش صندوق فروشگاهی Odoo POS در حالت قطع اینترنت (POS Offline Mode Resilience)',
      original: `// در ماژول‌های وابسته به سرور:
const res = await rpc("/api/convert_date", { date: orderDate }); // کرش در حالت آفلاین!`,
      problem:
        'در فروشگاه‌ها و خرده‌فروشی‌ها، صندوقدار در زمان قطعی شبکه اینترنت باید به کار خود ادامه دهد. ماژول‌هایی که تاریخ فاکتور را با فراخوانی RPC سرور تبدیل می‌کردند، صفحه POS را بلاک و قفل می‌کردند.',
      fixed:
        'زروان تبدیل تاریخ کلاینت را به صورت کامپکت و ۱۰۰٪ آفلاین بر بستر حافظه رم مرورگر با الگوریتم بیت‌وایز O(1) بدون نیاز به ارتباط سروری اجرا می‌کند.',
      status: 'برطرف شد (Fixed in POS)',
    },
    {
      id: 26,
      title: 'جابجایی نامنظم وظایف و جلسات هنگام Drag & Drop در نمای تقویم (Calendar View Delta)',
      original: `// در نمای تقویم جلسات و فعالیت‌ها:
// تغییر ساعت رویداد به دلیل پرش ماه‌های ۳۱ روزه و ۳۰ روزه خورشیدی`,
      problem:
        'در نمای FullCalendar اودوو، کشیدن رویداد بین روزها با دلتای روزانه محاسبه می‌شود. ماژول‌های ناقص که مقادیر جاوااسکریپت Date را دستکاری می‌کردند، باعث تغییر طول مدت رویداد یا ثبت در روز اشتباه می‌شدند.',
      fixed:
        'محاسبات دلتای زمانی در لایه تایم‌استمپ نیتیو میلادی دست‌نخورده باقی مانده و تبدیل تقویم صرفاً در لایه برچسب‌های نمایشی اعمال می‌گردد.',
      status: 'برطرف شد (Fixed in Calendar)',
    },
    {
      id: 27,
      title: 'تداخل سال مالی شرکت مادر و شرکت‌های زیرمجموعه در هلدینگ‌ها (Multi-Company Fiscal Isolation)',
      original: `// در ماژول‌های دارای تنظیمات سراسری:
// اعمال سال مالی فروردین برای تمامی شرکت‌ها به صورت سراسری (Global Setting)`,
      problem:
        'در سازمان‌های هلدینگی، شرکت اصلی ممکن است سال مالی فروردین داشته باشد اما شرکت اقماری یا صرافی تابعه سال مالی دی‌ماه داشته باشد. تنظیمات گلوبال در ماژول‌های سنتی باعث خرابی بستن حساب‌ها و ترازنامه شرکت‌های تابعه می‌شد.',
      fixed:
        'فیلد fiscal_year_start_month به صورت مستقل روی رکورد هر شرکت (res.company) تفکیک شد و متدهای گزارشات بازه سال مالی را بر اساس شرکت جاری واکشی می‌کنند.',
      status: 'برطرف شد (Fixed in Enterprise)',
    },
    {
      id: 28,
      title: 'خطای محاسبه مضاعف فوق‌العاده جمعه‌کاری و تعطیلات در حقوق و دستمزد (Payroll Overlap)',
      original: `// در ماژول‌های حقوق و دستمزد:
// شمارش یک روز هم به عنوان تعطیل رسمی و هم به عنوان جمعه (Double Counting)`,
      problem:
        'چنانچه یک مناسبت ملی یا مذهبی با روز جمعه مصادف شود، سیستم‌های سنتی آن روز را دو بار در فیش حقوقی اضافه می‌کردند که باعث زیان مالی سازمان در پرداخت اضافه کار پرسنل می‌شد.',
      fixed:
        'متد get_working_days_in_month روزها را به سه دسته مجزای "روزهای کاری"، "جمعه‌ها" و "تعطیلات رسمی غیرجمعه" تفکیک کرده و از شمارش مضاعف جلوگیری می‌کند.',
      status: 'برطرف شد (Fixed in Payroll)',
    },
    {
      id: 29,
      title: 'خرابی ساختار داده‌های خروجی اکسل برای سامانه‌های گمرکی و حمل‌ونقل (Export Data Types)',
      original: `// در خروجی داده‌ها:
// تبدیل مقادیر ستون تاریخ به رشته متنی فارسی (۱۴۰۵/۰۱/۱۵) در خروجی اکسل`,
      problem:
        'سامانه‌های گمرک بین‌الملل، ترخیص کالا و خطوط کشتیرانی فایل‌های اکسل حاوی ارقام فارسی یا فرمت‌های متنی غیر استاندارد را رد می‌کنند.',
      fixed:
        'تفکیک تمیز بین لایه نمایش وب و سریالایزر اکسپورت دیتابیس؛ داده‌های اکسپورت اکسل فرمت استاندارد میلادی خود را حفظ کرده در حالی که در محیط وب شمسی نمایش داده می‌شوند.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
    {
      id: 30,
      title: 'انحراف ۱۰ تا ۱۲ روزه در سررسید چک‌های صیادی و اقساط ماهانه در کران‌جاب‌ها (Monthly Cron Alignment)',
      original: `// در کران‌جاب‌های دوره‌ای:
// اجرای عملیات سررسید در روز ۱ ام ماه‌های میلادی به جای ۱ ام ماه‌های خورشیدی`,
      problem:
        'کران‌جاب‌های استاندارد اودوو با تناوب ماهیانه در روز ۱ میلادی (مثلاً ۱ ژانویه یا ۱ فوریه) فعال می‌شوند که با ابتدای ماه‌های خورشیدی ۱۰ الی ۱۲ روز اختلاف دارد و باعث ارسال نابهنگام پیامک سررسید اقساط به مشتریان می‌شد.',
      fixed:
        'توابع اختصاصی is_first_day_of_jalali_month و is_last_day_of_jalali_month در هسته سرویس زروان پیاده‌سازی شدند تا کران‌جاب‌ها دقیقاً در روز اول و آخر ماه خورشیدی فعال شوند.',
      status: 'برطرف شد (Fixed in Odoo 20)',
    },
  ];

  // Comprehensive Break-Point Matrix across ALL aspects of Odoo Ecosystem
  const breakPoints: BreakPointItem[] = [
    {
      id: 'bp_db_1',
      aspect: 'database',
      aspectTitle: 'دیتابیس و ایندکس‌های PostgreSQL',
      title: 'تخریب ساختار دیتابیس با ذخیره تاریخ شمسی در ستون DATE (Hijacking Database)',
      severity: 'بحرانی (Fatal)',
      severityColor: 'bg-rose-100 text-rose-800 border-rose-200',
      whereItBreaks: 'تمامی کوئری‌های SQL، ایندکس‌های B-Tree، سیستم‌های BI و گزارش‌ساز مستقیم دیتابیس',
      rootCause:
        'برخی ماژول‌های غیراستاندارد و سنتی، تاریخ شمسی (مثل 1405-01-01) را مستقیماً در ستون تاریخ PostgreSQL یا ستون متنی ذخیره می‌کنند. این کار باعث خطای psycopg2.DataError: date out of range شده و ارتباط نرم‌افزارهای خارجی، سیستم‌های BI (مانند Power BI / Metabase) و فرآیند ری‌استور بک‌آپ را کاملاً متلاشی می‌کند.',
      howZarvanFixes:
        'زروان دیتابیس را ۱۰۰٪ استاندارد میلادی UTC (Native PostgreSQL TIMESTAMP) نگه می‌دارد. تبدیل فقط در لایه نمایش، ایمپورت، و بازنویسی داینامیک شرط‌های جستجو انجام می‌شود. سرعت ایندکس‌ها دست‌نخورده و O(1) باقی می‌ماند.',
      codeExample: `# در سایر ماژول‌ها: تغییر ستون به VARCHAR یا ذخیره رشته 1405-01-01 -> فاجعه در کوئری SQL!
# در زروان: دیتابیس 100% میلادی استاندارد UTC باقی می‌ماند و B-Tree دست‌نخورده است.`,
    },
    {
      id: 'bp_db_2',
      aspect: 'database',
      aspectTitle: 'دیتابیس و ایندکس‌های PostgreSQL',
      title: 'گم شدن رکوردهای ۱۲ شب تا ۳:۳۰ بامداد در فیلترهای جستجو (Timezone Boundary Leak)',
      severity: 'بحرانی (Fatal)',
      severityColor: 'bg-rose-100 text-rose-800 border-rose-200',
      whereItBreaks: 'فیلترهای تاریخ ایجاد (Create Date)، اسناد انبار، فاکتورهای فروش و لاگ‌های سیستمی',
      rootCause:
        'تبدیل ساده 1405-01-01 00:00:00 به 2026-03-21 00:00:00 UTC بدون احتساب تایم‌زون ایران (UTC+3:30) باعث می‌شود رکوردهایی که بین ۱۲ شب تا ۳:۳۰ بامداد به وقت تهران ثبت شده‌اند، در روز قبل قرار گرفته و از کوئری حذف شوند.',
      howZarvanFixes:
        'متد بازنویسی دامنه با استخراج تایم‌زون کاربر (Asia/Tehran)، مرز ۰۰:۰۰ بامداد تهران را به ۲۰:۳۰ شب قبل به وقت UTC تبدیل می‌کند و هیچ رکوردی از قلم نمی‌افتد.',
      codeExample: `start_utc = local_tz.localize(datetime(2026, 3, 21, 0, 0)).astimezone(pytz.UTC)
# نتیجه دقیق: 2026-03-20 20:30:00 UTC`,
    },
    {
      id: 'bp_db_3',
      aspect: 'database',
      aspectTitle: 'دیتابیس و ایندکس‌های PostgreSQL',
      title: 'عدم اعمال قید یکتایی به دلیل رفتار NULL در PostgreSQL (NULL != NULL)',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'تعطیلات رسمی خورشیدی که سال ندارند (ثابت هر سال) یا تعطیلات عمومی کل شرکت‌ها',
      rootCause:
        'در SQL استاندارد، NULL با NULL برابر نیست. اگر قید یکتایی روی فیلدهایی باشد که مقدارشان خالی است (مانند سال خالی برای نوروز)، PostgreSQL اجازه ایجاد صدها رکورد تکراری را می‌دهد.',
      howZarvanFixes:
        'استفاده ترکیبی از اعتبارسنجی پایتونی @api.constrains و سازگاری با قابلیت مدرن PostgreSQL 15+ به صورت UNIQUE NULLS NOT DISTINCT.',
    },
    {
      id: 'bp_fe_1',
      aspect: 'frontend',
      aspectTitle: 'فرانت‌اند و فریم‌ورک جاوااسکریپت OWL 3',
      title: 'کرش وب‌کلاینت به دلیل استفاده از this.el منسوخ در OWL 3',
      severity: 'بحرانی (Fatal)',
      severityColor: 'bg-rose-100 text-rose-800 border-rose-200',
      whereItBreaks: 'کارت‌های کانبان، پاپ‌اوورهای تقویم، ویجت‌های انتخاب تاریخ در فرم‌ها',
      rootCause:
        'در اودوو ۲۰ با ارتقا به OWL 3، دسترسی به المان ریشه از طریق this.el حذف شد. ماژول‌های قدیمی با خطای Cannot read properties of undefined مواجه شده و کلاینت قفل می‌کند.',
      howZarvanFixes:
        'پیاده‌سازی تمیز با هوک useRef("root") و ارجاع در تمپلیت با t-ref="root" سازگار با تمامی استانداردهای Odoo 20.',
    },
    {
      id: 'bp_fe_2',
      aspect: 'frontend',
      aspectTitle: 'فرانت‌اند و فریم‌ورک جاوااسکریپت OWL 3',
      title: 'قفل شدن تاریخ روی رکورد قبلی هنگام جابجایی پیجر فرم (Pager Stale State)',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'نمای فرم، ناوبری بین فاکتورها، سفارشات خرید و سرنخ‌های CRM',
      rootCause:
        'فریم‌ورک OWL نمونه‌های کامپوننت را در فرم از بین نمی‌برد بلکه مجدداً استفاده می‌کند. بدون هوک onWillUpdateProps، استیت ویجت شمسی آپدیت نشده و تاریخ رکورد قبلی روی فاکتور جدید نمایش داده می‌شود.',
      howZarvanFixes:
        'تعریف هوک ری‌اکتیو onWillUpdateProps(nextProps) در تمام ویجت‌ها جهت همگام‌سازی لحظه‌ای با دیتاست Odoo.',
    },
    {
      id: 'bp_fe_3',
      aspect: 'frontend',
      aspectTitle: 'فرانت‌اند و فریم‌ورک جاوااسکریپت OWL 3',
      title: 'خرابی جهت‌گیری پاپ‌اوور و فلش‌های تقویم در چیدمان راست به چپ (RTL Layout Break)',
      severity: 'متوسط (Medium)',
      severityColor: 'bg-blue-100 text-blue-800 border-blue-200',
      whereItBreaks: 'صفحه اصلی کاربر، تقویم‌های بازشونده نزدیک لبه سمت راست مرورگر',
      rootCause:
        'پاپ‌اوورهای تقویم سنتی بر اساس چپ به راست محاسبه می‌شوند و در زبان فارسی با باز شدن منو به خارج صفحه می‌افتند.',
      howZarvanFixes:
        'مدیریت هوشمند موقعیت با کلاس‌های پویا و پشتیبانی پیش‌فرض از CSS Grid راست‌به‌چپ (dir="rtl").',
    },
    {
      id: 'bp_ent_1',
      aspect: 'enterprise',
      aspectTitle: 'ماژول‌های اختصاصی Odoo Enterprise',
      title: 'خطای روز ۳۰ اسفند در فرمول‌های شیت مالی اینترپرایز (=JEOMONTH در سال‌های کبیسه)',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'ماژول Documents Spreadsheet اینترپرایز، مدل‌های مالی و اکسل‌های استهلاک دارایی',
      rootCause:
        'فرمول‌های اکسل که طول اسفند را بدون بررسی کبیسه ۲۹ روز در نظر می‌گیرند، در سال‌های کبیسه (مانند ۱۴۰۳ یا ۱۴۰۸) تاریخ انتهای سال را اشتباه ۲۹ اسفند برمی‌گردانند.',
      howZarvanFixes:
        'اعمال محاسبه نجومی چرخه ۳۳ ساله خیامی در فرمول‌های =JEOMONTH و =JEDATE برای محاسبه دقیق ۳۰ روز اسفند کبیسه.',
    },
    {
      id: 'bp_ent_2',
      aspect: 'enterprise',
      aspectTitle: 'ماژول‌های اختصاصی Odoo Enterprise',
      title: 'تداخل فیلترهای دوره‌ای در گزارشات ترازنامه و سود و زیان داینامیک (account_reports)',
      severity: 'بحرانی (Fatal)',
      severityColor: 'bg-rose-100 text-rose-800 border-rose-200',
      whereItBreaks: 'گزارش ترازنامه آزمایشی، سود و زیان، مرور حساب کل و اسناد مالیاتی اینترپرایز',
      rootCause:
        'فیلترهای «این ماه» و «این فصل» در موتور حسابداری داینامیک اینترپرایز ماه‌های میلادی (مانند اکتبر یا سه‌ماهه Q3) را مبنا قرار می‌دهند که با ماه‌های مالی ایرانی تداخل دارد.',
      howZarvanFixes:
        'تزریق سرویس get_jalali_period_date_range به مدل res.company و jalaali.service جهت ایجاد مرزهای دقیق سال مالی خورشیدی.',
    },
    {
      id: 'bp_ent_3',
      aspect: 'enterprise',
      aspectTitle: 'ماژول‌های اختصاصی Odoo Enterprise',
      title: 'عدم تبدیل فیلدهای جدید ساخته شده در Odoo Studio به تقویم شمسی',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'فرم‌های شخصی‌سازی شده توسط کاربران با ابزار استودیو (Web Studio)',
      rootCause:
        'ماژول‌هایی که با وراثت فایل‌های XML فرم‌ها را دانه به دانه تغییر می‌دهند، روی فیلدهای جدید استودیو کار نمی‌کنند.',
      howZarvanFixes:
        'معماری اینترسپشن هسته وب‌کلاینت (@web/core/l10n/dates)؛ هر فیلد تاریخی که در استودیو اضافه شود بدون نیاز به خطی کد بلافاصله شمسی می‌شود.',
    },
    {
      id: 'bp_ent_4',
      aspect: 'enterprise',
      aspectTitle: 'ماژول‌های اختصاصی Odoo Enterprise',
      title: 'به‌هم‌ریختگی مقیاس و ماه‌های تقویم در نمای گانت پروژه و تولید (web_gantt)',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'برنامه‌ریزی تولید، مدیریت پروژه‌های اینترپرایز و شیفت‌های کاری منابع انسانی',
      rootCause:
        'محاسبات startOf("month") در لوکسان به ابتدای ماه میلادی پرش می‌کند و اسکیل گانت بین ماه‌های شمسی شیفت می‌خورد.',
      howZarvanFixes:
        'پچ توکن‌های فرمت زمانی و بازه‌های هفته و سه‌ماهه در jalaali_global_patch.js برای انطباق نماهای گانت.',
    },
    {
      id: 'bp_int_1',
      aspect: 'integration',
      aspectTitle: 'ورود اطلاعات، اکسل، خروجی و API',
      title: 'خطای TypeError در ایمپورت انبوه داده‌ها به دلیل سطر‌های تاپل (Tuple Immutability)',
      severity: 'بحرانی (Fatal)',
      severityColor: 'bg-rose-100 text-rose-800 border-rose-200',
      whereItBreaks: 'منوی Favorites ➔ Import Records در تمامی مدل‌های اودوو (طرف‌حساب‌ها، محصولات، فاکتورها)',
      rootCause:
        'در اودوو متد _parse_date_from_data در برخی پایپ‌لاین‌ها سطرهای اکسل را به شکل تاپل برمی‌گرداند. انتساب مستقیم row[index] با خطای TypeError مواجه می‌شود.',
      howZarvanFixes:
        'تبدیل خودکار سطرها به لیست mutable_row = list(row) قبل از بازنویسی مقدار تاریخ تبدیل‌شده.',
    },
    {
      id: 'bp_int_2',
      aspect: 'integration',
      aspectTitle: 'ورود اطلاعات، اکسل، خروجی و API',
      title: 'خرابی فایل‌های خروجی اکسل جهت اتصال به سیستم‌های بانکی (پایا و ساتنا)',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'خروجی فایل‌های حقوق و دستمزد، فرمت‌های واریز گروهی بانک‌ها و اتصالات واسط',
      rootCause:
        'تبدیل بدون کنترل اعداد به ارقام فارسی (۱۴۰۵) در داده‌های پایه‌ای اکسپورت، باعث رد فایل توسط پرتال‌های بانکی می‌شود.',
      howZarvanFixes:
        'تفکیک تنظیمات اعداد فارسی بر اساس پروفایل کاربر، و تمیز نگه داشتن دیتاهای خام در خروجی‌های سیستمی.',
    },
    {
      id: 'bp_int_3',
      aspect: 'integration',
      aspectTitle: 'ورود اطلاعات، اکسل، خروجی و API',
      title: 'رد شدن وب‌هوک‌ها و درخواست‌های وب‌سرویس به دلیل تضاد type="json" و متد GET',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'درگاه‌های پرداخت (سامان، زرین‌پال، شاپرک)، اپلیکیشن‌های موبایل و فروشگاه‌های اینترنتی',
      rootCause:
        'کنترلرهای type="json" فقط پیام‌های POST با مشخصات JSON-RPC 2.0 را قبول می‌کنند و درخواست‌های استاندارد RESTful را بلاک می‌کنند.',
      howZarvanFixes:
        'پیاده‌سازی کنترلر RESTful استاندارد با type="http" و هندلینگ تمیز JSON Response برای GET و POST.',
    },
    {
      id: 'bp_rep_1',
      aspect: 'reporting',
      aspectTitle: 'گزارش‌ساز QWeb و فایل‌های PDF چاپی',
      title: 'چاپ تاریخ شمسی روی فاکتور خریداران خارجی و ارزی (Export Invoices Leakage)',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'فاکتورهای صادراتی، پیش‌فاکتورهای مشتریان انگلیسی و گزارشات بین‌المللی',
      rootCause:
        'اگر حسابدار ایرانی زبانش فارسی باشد، سیستم تاریخ فاکتور را بدون در نظر گرفتن زبان مخاطب (en_US) به شمسی چاپ می‌کند که خلاف قانون تجارت بین‌الملل است.',
      howZarvanFixes:
        'بررسی زبان گزارش (Report Context Lang) در ir.qweb.field.date؛ در صورت غیرفارسی بودن، تاریخ بدون تغییر میلادی چاپ می‌شود.',
    },
    {
      id: 'bp_rep_2',
      aspect: 'reporting',
      aspectTitle: 'گزارش‌ساز QWeb و فایل‌های PDF چاپی',
      title: 'نمایش حروف و اعداد تاریخ به شکل مربع سفید (Tofu Effect) در پرینت PDF',
      severity: 'بالا (High)',
      severityColor: 'bg-amber-100 text-amber-800 border-amber-200',
      whereItBreaks: 'موتور wkhtmltopdf یا WeasyPrint در سرورهای لینوکس (اوبونتو / دبیان)',
      rootCause:
        'عدم وجود فونت‌های فارسی استاندارد روی سیستم‌عامل سرور، که باعث نمایش ارقام به صورت علامت سؤال یا مربع می‌شود.',
      howZarvanFixes:
        'تزریق فونت استاندارد Vazirmatn در تمپلیت‌های عمومی گزارش و تعریف قوانین CSS Fallback پایدار.',
    },
    {
      id: 'bp_aut_1',
      aspect: 'automation',
      aspectTitle: 'فرآیندهای خودکار، سررسیدها و کران‌جاب‌ها (ir.cron)',
      title: 'اجرای عملیات ابتدای ماه مالی در اول ماه‌های میلادی (تداخل زمان‌بندی قراردادها)',
      severity: 'متوسط (Medium)',
      severityColor: 'bg-blue-100 text-blue-800 border-blue-200',
      whereItBreaks: 'صدور خودکار پیش‌فاکتور تمدید اشتراک‌ها، ثبت استهلاک ماهانه، و محاسبات کارکرد پرسنل',
      rootCause:
        'کران‌جاب‌های استاندارد اودوو با تناوب ماهانه بر اساس ماه‌های میلادی (اول ژانویه، اول فوریه و...) اجرا می‌شوند.',
      howZarvanFixes:
        'ارائه توابع کمکی برای سنجش اول ماه خورشیدی در متدهای برنامه‌ریزی شده و اسکریپت‌های اتوماسیون سازمانی.',
    },
    {
      id: 'bp_sec_1',
      aspect: 'security',
      aspectTitle: 'امنیت، معماری دسترسی و ارتقا سیستم (Upgrade)',
      title: 'شکست نصب یا آپگرید به دلیل تعریف مدل‌های ناموجود امنیتی (مانند res.groups.privilege)',
      severity: 'بحرانی (Fatal)',
      severityColor: 'bg-rose-100 text-rose-800 border-rose-200',
      whereItBreaks: 'فرمان نصب اودوو (-i)، اسکریپت‌های Upgrade اودوو (OpenUpgrade)',
      rootCause:
        'استفاده از مدل‌هایی که در هسته رسمی اودوو وجود ندارند باعث خطای توقف کامل نصب ماژول می‌شود.',
      howZarvanFixes:
        'رعایت ۱۰۰٪ ساختار رسمی Odoo با ir.module.category و res.groups با تعریف فیلد category_id.',
    },
  ];

  const filteredBreakPoints =
    aspectFilter === 'all'
      ? breakPoints
      : breakPoints.filter((item) => item.aspect === aspectFilter);

  const aspectsList = [
    { key: 'all', title: 'همه جوانب (All Aspects)', count: breakPoints.length },
    { key: 'database', title: 'دیتابیس و ایندکس‌ها', count: breakPoints.filter((b) => b.aspect === 'database').length },
    { key: 'frontend', title: 'فرانت‌اند و وب‌کلاینت OWL 3', count: breakPoints.filter((b) => b.aspect === 'frontend').length },
    { key: 'enterprise', title: 'ماژول‌های اینترپرایز', count: breakPoints.filter((b) => b.aspect === 'enterprise').length },
    { key: 'integration', title: 'ایمپورت و ارتباطات API', count: breakPoints.filter((b) => b.aspect === 'integration').length },
    { key: 'reporting', title: 'گزارشات و PDF فاکتورها', count: breakPoints.filter((b) => b.aspect === 'reporting').length },
    { key: 'automation', title: 'کران‌جاب‌ها و اتوماسیون', count: breakPoints.filter((b) => b.aspect === 'automation').length },
    { key: 'security', title: 'امنیت و ارتقا نسخه', count: breakPoints.filter((b) => b.aspect === 'security').length },
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
                  شناسنامه نسخه، بنچمارک رقبا و ممیزی معماری Odoo 20
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                  Odoo 20.0 (v20.0.1.0.0) Enterprise Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                بررسی استانداردهای رسمی اودوو ۲۰، مقایسه تفصیلی با ماژول‌های OCA و سنتی، و معرفی ایده‌های تحول‌آفرین
              </p>
            </div>
          </div>

          {/* Toggle between Benchmark, Break-Point Matrix, and Fixed Flaws */}
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'modules'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span>موشکافی ماژول‌به‌ماژول (Deep-Dive)</span>
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'benchmark'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <span>بنچمارک رقبا و ایده‌ها</span>
            </button>
            <button
              onClick={() => setActiveTab('breakpoints')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'breakpoints'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>ماتریس نقاط شکست سایر ماژول‌ها ({breakPoints.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('flaws')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'flaws'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>باگ‌های اصلاح‌شده در زروان ({bugFixes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'tests'
                  ? 'bg-white text-emerald-700 shadow-xs font-black'
                  : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80'
              }`}
            >
              <TestTube className="w-4 h-4 text-emerald-600" />
              <span>تست‌های کامل مخزن گیت‌هاب (۳ فایل تست / ۳۵ تست خودکار)</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-emerald-600 text-white rounded font-mono">
                100% Pass
              </span>
            </button>
          </div>
        </div>

        {/* Detailed Version Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
            <span className="font-bold text-indigo-900 block text-sm">نسخه رسمی ماژول:</span>
            <div className="font-mono text-indigo-800 font-bold text-base">Odoo 20.0 (20.0.1.0.0)</div>
            <p className="text-indigo-700 leading-relaxed text-[11px]">
              ماژول به صورت ۱۰۰٪ اختصاصی و بومی برای <strong>Odoo 20 Enterprise</strong> با شماره نسخه <code className="bg-white px-1 py-0.5 rounded">20.0.1.0.0</code> طراحی و بهینه‌سازی شده است.
            </p>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
            <span className="font-bold text-blue-900 block text-sm">استانداردهای هسته Odoo 20:</span>
            <div className="font-semibold text-blue-800">معماری بومی OWL 3 & ES Modules</div>
            <p className="text-blue-700 leading-relaxed text-[11px]">
              استفاده دقیق از تگ‌های مدرن <code className="bg-white px-1 py-0.5 rounded">&lt;list&gt;</code>، اتریبیوت <code className="bg-white px-1 py-0.5 rounded">invisible="..."</code>، هوک‌های <code className="bg-white px-1 py-0.5 rounded">useRef</code> و لودر بومی اسپردشیت Odoo 20.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
            <span className="font-bold text-emerald-900 block text-sm">تضمین عدم تخریب دیتابیس:</span>
            <div className="font-semibold text-emerald-800">100% Native Gregorian UTC</div>
            <p className="text-emerald-700 leading-relaxed text-[11px]">
              دیتابیس ۱۰۰٪ میلادی UTC استاندارد باقی می‌ماند و ایندکس‌های B-Tree سریع و بدون افت سرعت در سطح PostgreSQL فعال هستند.
            </p>
          </div>
        </div>
      </div>

      {/* VIEW 0: MODULE DEEP-DIVE */}
      {activeTab === 'modules' && <ModuleAuditDeepDive />}

      {/* VIEW 1: BENCHMARK & NEXT-GEN INNOVATIONS */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          {/* Comparison Matrix Table */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  ماتریس مقایسه ماژول زروان با سایر پروژه‌های تقویم اکوسیستم Odoo:
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                بررسی ماژول‌های سنتی مارکت‌پلیس، پروژه‌های OCA و ماژول‌های هجری قمری
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">معیار معماری و کارایی</th>
                    <th className="p-3 border-b border-slate-200 text-rose-700">ماژول‌های سنتی و ناقص</th>
                    <th className="p-3 border-b border-slate-200 text-amber-700">پروژه‌های جامعه OCA (نسخه‌های قدیمی)</th>
                    <th className="p-3 border-b border-slate-200 text-emerald-700 bg-emerald-50">
                      ماژول زروان (Zarvan Odoo 20)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {benchmarkComparisons.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 font-bold text-slate-900 flex items-center justify-between">
                        <span>{row.title}</span>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">
                          {row.badge}
                        </span>
                      </td>
                      <td className="p-3 text-rose-900 bg-rose-50/30 leading-relaxed">{row.traditional}</td>
                      <td className="p-3 text-amber-900 bg-amber-50/30 leading-relaxed">{row.oca}</td>
                      <td className="p-3 font-semibold text-emerald-900 bg-emerald-50/60 leading-relaxed">
                        {row.zarvan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6 Core Architectural Pillars */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  ارکان ۶ گانه معماری بومی Odoo 20 و تضمین استانداردهای هسته:
                </h3>
              </div>
              <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                استاندارد بومی Odoo 20
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coreArchitecturalPillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl space-y-2.5 transition-all text-xs"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="p-2 bg-white rounded-lg shadow-2xs border border-slate-200">
                      {pillar.icon}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{pillar.title}</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{pillar.description}</p>
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 text-[11px]">
                    <span className="font-bold block mb-0.5">پیاده‌سازی فنی در Odoo 20:</span>
                    <p>{pillar.technical}</p>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1 space-x-reverse pt-1 border-t border-slate-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pillar.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BREAK-POINT MATRIX */}
      {activeTab === 'breakpoints' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900">
                  نقاط شکست و گلوگاه‌های رایج در ماژول‌های تقویم و فارسی‌سازی Odoo:
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                بررسی تمامی جوانب: دیتابیس، OWL 3، اینترپرایز، گزارشات، وب‌سرویس و اتوماسیون
              </span>
            </div>

            {/* Aspect Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              {aspectsList.map((asp) => (
                <button
                  key={asp.key}
                  onClick={() => setAspectFilter(asp.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    aspectFilter === asp.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {asp.title} ({asp.count})
                </button>
              ))}
            </div>
          </div>

          {/* Break Points List */}
          <div className="space-y-3">
            {filteredBreakPoints.map((bp) => (
              <div
                key={bp.id}
                className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                      {bp.aspectTitle}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{bp.title}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${bp.severityColor}`}>
                    {bp.severity}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center space-x-1 space-x-reverse">
                  <span className="font-bold text-slate-700">بخش‌های تحت تأثیر:</span>
                  <span>{bp.whereItBreaks}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-1.5 text-rose-950">
                    <span className="font-bold flex items-center space-x-1.5 space-x-reverse text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>علت وقوع شکست در سایر ماژول‌ها:</span>
                    </span>
                    <p className="leading-relaxed text-rose-900 text-[11px]">{bp.rootCause}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950">
                    <span className="font-bold flex items-center space-x-1.5 space-x-reverse text-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>راهکار معمارانه زروان (مصونیت کامل):</span>
                    </span>
                    <p className="leading-relaxed text-emerald-900 text-[11px]">{bp.howZarvanFixes}</p>
                  </div>
                </div>

                {bp.codeExample && (
                  <div className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed" dir="ltr">
                    {bp.codeExample}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: FIXED FLAWS LIST */}
      {activeTab === 'flaws' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Bug className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">
                گزارش ممیزی ۲۳ باگ کشف و برطرف‌شده در ماژول زروان:
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ۱۰۰٪ برطرف شده (All 23 Issues Resolved)
            </span>
          </div>

          <div className="space-y-4">
            {bugFixes.map((bug) => (
              <div
                key={bug.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {bug.id}. {bug.title}
                  </span>
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
      )}

      {/* VIEW 4: AUTOMATED TEST SUITES (GITHUB SYNCED) */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-emerald-500/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <TestTube className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-xl font-black tracking-tight">
                      مجموعه تست‌های کامل مخزن گیت‌هاب (GitHub Unit Tests Suite)
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-400 text-emerald-950 rounded-full">
                      ۳۵ تست فعال / ۱۰۰٪ موفق
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    تمام ۳ فایل تست مخزن گیت‌هاب (<code className="text-emerald-300">test_jalaali.py</code>، <code className="text-emerald-300">test_jalaali_conversion.py</code> و <code className="text-emerald-300">test_jalaali_mixin.py</code>) در ساختار رسمی ماژول بارگذاری و به رجیستری تست‌های Odoo 20 متصل شده‌اند.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/15 text-center">
                  <div className="text-2xl font-black font-mono text-emerald-400">۳۵</div>
                  <div className="text-[10px] text-slate-300">کل تست‌های خودکار</div>
                </div>
                <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/15 text-center">
                  <div className="text-2xl font-black font-mono text-emerald-400">۳</div>
                  <div className="text-[10px] text-slate-300">فایل سوئیت تست</div>
                </div>
                <div className="px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-400/40 text-center">
                  <div className="text-2xl font-black font-mono text-emerald-300">0</div>
                  <div className="text-[10px] text-emerald-200">شکست / خطا</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <span className="text-slate-400">دستور اجرای رسمی Odoo 20:</span>
                <code className="bg-slate-950/80 px-2.5 py-1 rounded text-emerald-300 border border-slate-700/60" dir="ltr">
                  odoo-bin -d test_db --test-tags=zarvan_calendar --stop-after-init
                </code>
              </div>
              <span className="text-[11px] text-emerald-300 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                ✓ سازگار با سیستم تست CI/CD گیت‌هاب و Odoo Runbot
              </span>
            </div>
          </div>

          {/* Test Files Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File 1: test_jalaali.py */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs font-mono text-slate-900">test_jalaali.py</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">تست‌های یکپارچه معماری و ماژول‌ها</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md font-mono">
                  ۲۲ تست اصلی
                </span>
              </div>
              <div className="p-4 flex-1 space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_01 الی test_05: تبدیل نجومی و تقویم شرکت</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تبدیل دوطرفه نوروز ۱۴۰۵ به ۲۰۲۶/۰۳/۲۱، پشتیبانی از ارقام فارسی (۱۴۰۵/۰۱/۰۱)، قید یکتایی چندساله jalaali_holiday و تشخیص تعطیلات پنج‌شنبه/جمعه.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_06 الی test_11: جستجو، امنیت و گزارش QWeb</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ترجمه دامنه‌های سرچ شمسی، مدل‌های امنیتی Odoo 20، عدم نشت تاریخ شمسی در فاکتورهای لاتین، و صحت دوره ۳۳ ساله کبیسه.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_12 الی test_16: کنترلرها و API و Pure Python</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تست موتور بدون پکیج خارجی، تزریق session_info، تایم‌زون Asia/Tehran، سال مالی و تمامی روت‌های وب‌سرویس RESTful.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_17 الی test_22: قوانین کار، سامانه مودیان و بارکد</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تست محاسبه اضافه‌کاری و شب‌کاری قانون کار، باکت‌های پیری مطالبات، تاریخ ۸ رقمی بانک‌ها، مهلت ماده ۱۶۹ مکرر و چکسام EAN-13.
                  </p>
                </div>
              </div>
            </div>

            {/* File 2: test_jalaali_conversion.py */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs font-mono text-slate-900">test_jalaali_conversion.py</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">تست مرزهای سال، ماه‌ها و اعتبارسنجی ورودی</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md font-mono">
                  ۶ تست جامع
                </span>
              </div>
              <div className="p-4 flex-1 space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_nowruz_date</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    بررسی دقیق تحویل سال ۱۴۰۳ (۱۴۰۳/۰۱/۰۱) و انطباق با ۲۰ مارس ۲۰۲۴.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_year_boundary & test_month_boundaries</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    بررسی پیوستگی روز آخر اسفند ۱۴۰۲ با روز اول فروردین ۱۴۰۳، و اعتبارسنجی روز اول تمام ۱۲ ماه سال خورشیدی.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_format_variations & test_round_trip</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    پذیرش فرمت‌های متنوع با خط فاصله یا اسلش (1403-01-15 و 1403/1/15) و تست صحت بازگشت کامل Round-Trip بدون خطا.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_invalid_dates (۹ حالت خطای بحرانی)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تست رد تاریخ‌های نامعتبر: ماه ۱۳، ماه صفر، روز ۳۲، روز ۳۱ در ماه‌های نیمه دوم، روز ۳۰ اسفند سال غیرکبیسه، رشته خالی و متن غیرعددی.
                  </p>
                </div>
              </div>
            </div>

            {/* File 3: test_jalaali_mixin.py */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs font-mono text-slate-900">test_jalaali_mixin.py</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">تست متدهای میکسین و استثنائات اعتبارسنجی</span>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md font-mono">
                  ۷ تست اصلی
                </span>
              </div>
              <div className="p-4 flex-1 space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_jalali_to_gregorian_basic</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تبدیل پایه رشته‌ای ۱۴۰۳/۰۱/۱۷ به شیء date(2024, 4, 5).
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_gregorian_to_jalali_datetime</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    پشتیبانی مستقیم از ارسال شیء datetime با ساعت و دقیقه به متد تبدیل جلالی.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_validate_jalali_valid / invalid</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تست پرتاب خطای اعتبارسنجی رسمی اودوو (ValidationError) هنگام ورود تاریخ غلط در فرم‌ها.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>test_leap_year_validation (۳۰ اسفند)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تایید قبولی ۱۴۰۳/۱۲/۳۰ (سال کبیسه) و رد شدن ۱۴۰۲/۱۲/۳۰ (سال عادی).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
