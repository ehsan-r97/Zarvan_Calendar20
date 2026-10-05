import React, { useState } from 'react';
import {
  CreditCard,
  Package,
  Cpu,
  Users,
  ShoppingCart,
  Store,
  FolderGit2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ModuleAuditDetail {
  id: string;
  name: string;
  enName: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  flaws: {
    title: string;
    scenario: string;
    impact: string;
    severity: 'بحرانی (Fatal)' | 'بالا (High)' | 'متوسط (Medium)';
    zarvanFix: string;
    technicalCode: string;
  }[];
}

export const ModuleAuditDeepDive: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string>('account');

  const modulesData: ModuleAuditDetail[] = [
    {
      id: 'account',
      name: 'حسابداری و اسناد مالی',
      enName: 'Account & Invoicing',
      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
      badge: '۴ نقطه شکست بحرانی',
      description:
        'حساس‌ترین ماژول سازمان؛ کوچک‌ترین خطا در مرزهای تقویم منجر به جریمه‌های سنگین مالیاتی و رد دفاتر قانونی می‌شود.',
      flaws: [
        {
          title: 'جابجایی درآمد مشمول مالیات در گزارشات فصلی ماده ۱۶۹ (سامانه مودیان)',
          scenario:
            'اودوو دوره‌های فصلی را بر اساس سه‌ماهه‌های میلادی (Q1: ژانویه تا مارس) فیلتر می‌کند. تطبیق ندادن این دوره‌ها با فصول خورشیدی (بهار: ۱ فروردین تا ۳۱ خرداد) باعث می‌شود درآمد ۱۰ روز ابتدایی فروردین در اظهارنامه فصل زمستان سال قبل ثبت شود.',
          impact: 'مغایرت دفاتر مالی با کارپوشه سامانه مودیان و جریمه قطعی کتمان درآمد توسط سازمان امور مالیاتی.',
          severity: 'بحرانی (Fatal)',
          zarvanFix:
            'متد get_jalali_period_date_range مرزهای دقیق هر فصل خورشیدی را محاسبه کرده و فیلترهای گزارش مالیات ارزش افزوده را منطبق بر تقویم رسمی کشور بازنویسی می‌کند.',
          technicalCode: `dates = service.get_jalali_period_date_range('quarter', 1405, 1)
# start: 2026-03-21 (01 Farvardin), end: 2026-06-21 (31 Khordad)`,
        },
        {
          title: 'قفل زودهنگام سال مالی و توقف فروش (Fiscal Year Lock Date)',
          scenario:
            'هنگام بستن سال مالی، حسابدار تاریخ قفل را ۲۹ اسفند ثبت می‌کند. ماژول‌های ناقص بدون تبدیل دقیق، این تاریخ را به پایان دسامبر میلادی ارسال کرده و ۹ ماه از عملیات جاری سال را به اشتباه قفل می‌کنند!',
          impact: 'کاربران فروش و انبار امکان ثبت هیچ سندی را نخواهند داشت و کل سازمان مختل می‌شود.',
          severity: 'بحرانی (Fatal)',
          zarvanFix:
            'تبدیل نقطه قفل مالیاتی به صورت لحظه‌ای به تاریخ دقیق UTC معادل ۲۹ اسفند در PostgreSQL.',
          technicalCode: `lock_utc = company.get_jalali_fiscal_year_dates(1404)['end_date']`,
        },
        {
          title: 'خطای انحراف اقساط جدول استهلاک دارایی‌ها (Asset Depreciation Drift)',
          scenario:
            'تابع پیش‌فرض relativedelta(months=1) باعث ثبت اسناد استهلاک در روزهای تصادفی ماه (۱۱ اردیبهشت، ۱۰ خرداد و...) می‌شود در حالی که استهلاک باید روز آخر ماه شمسی ثبت شود.',
          impact: 'رد شدن جدول استهلاک توسط حسابرسان مستقل و ممیزین دارایی.',
          severity: 'بالا (High)',
          zarvanFix:
            'اعمال سرویس is_last_day_of_jalali_month برای اسنپ کردن اقساط به روز ۲۹/۳۰/۳۱ هر ماه خورشیدی.',
          technicalCode: `max_d = mixin.get_days_in_jalali_month(jy, jm) # 31, 30 or 29/30`,
        },
        {
          title: 'مرتب‌سازی الفبایی تاریخ سررسید چک‌های صیادی (Post-Dated Cheques)',
          scenario:
            'در ماژول‌هایی که تاریخ را به صورت رشته ذخیره می‌کنند، چک‌های سررسید مهر (1405/07) قبل از اردیبهشت (1405/02) در لیست نمایش داده می‌شوند!',
          impact: 'برگشت خوردن چک‌های سازمان و مسدود شدن حساب‌های بانکی شرکت.',
          severity: 'بالا (High)',
          zarvanFix:
            'حفظ ۱۰۰٪ ستون دیتابیس به صورت TIMESTAMP استاندارد؛ مرتب‌سازی همیشه زمانی است نه الفبایی.',
          technicalCode: `ORDER BY date_maturity ASC -- Native PostgreSQL B-Tree Index`,
        },
      ],
    },
    {
      id: 'stock',
      name: 'انبار و موجودی کالا',
      enName: 'Stock & Logistics',
      icon: <Package className="w-5 h-5 text-amber-600" />,
      badge: '۳ نقطه شکست عملیاتی',
      description:
        'نبض لجستیک و تامین؛ انحراف در تاریخ‌های تحویل و تاریخ انقضا موجب جریمه‌های بهداشتی و ابطال حواله‌ها می‌شود.',
      flaws: [
        {
          title: 'خطای تاریخ هزینه‌های تمام‌شده سربار (Landed Costs Allocation)',
          scenario:
            'هنگام اعمال هزینه‌های ترخیص گمرکی و حمل روی رسیدهای انبار گذشته، در صورت ارسال تاریخ شمسی به کوئری ارزش‌گذاری، سیستم لایه‌های بهای تمام‌شده را به اشتباه در سال‌های آینده تعدیل می‌کند.',
          impact: 'خرابی سود ناویژه شرکت در گزارش سود و زیان و خطای ارزیابی موجودی انبار در پایان دوره.',
          severity: 'بحرانی (Fatal)',
          zarvanFix:
            'کلاس‌های StockLandedCost با تاریخ میلادی لایه ورودی تطبیق می‌یابند و فقط برچسب‌ها شمسی نمایش می‌یابند.',
          technicalCode: `account_move.date = landed_cost.date # Always Valid Native Date`,
        },
        {
          title: 'جابجایی روز تحویل در برگه چاپی خروج انبار (Delivery Slip Timezone Cutoff)',
          scenario:
            'به دلیل اختلاف ساعت ایران (UTC+03:30)، حواله‌هایی که در ساعات اولیه صبح ثبت می‌شوند در چاپ فیزیکی انبار روی روز قبل درج می‌شوند.',
          impact: 'اشتباه رانندگان و انبارداران در ارسال سفارشات و تاخیر در تحویل به مشتری.',
          severity: 'بالا (High)',
          zarvanFix:
            'اعمال تایم‌زون کاربر انبار در فرمت‌کننده QWeb برگه خروج انبار و حواله پیکاپ.',
          technicalCode: `local_dt = dt.astimezone(pytz.timezone('Asia/Tehran'))`,
        },
        {
          title: 'ابطال بارکدهای تاریخ انقضای بهداشتی کالاها (GS1-128 Expiry Dates)',
          scenario:
            'اسکنرهای صنعتی در صنایع دارویی و غذایی انتظار فرمت عددی بین‌المللی دارند. ذخیره شمسی در دیتابیس بارکدخوان‌ها را متوقف می‌کند.',
          impact: 'توقف خط بسته‌بندی کارخانه و عدم امکان صدور پروانه بهداشتی.',
          severity: 'بالا (High)',
          zarvanFix:
            'تفکیک برچسب چاپی فارسی برای سازمان غذا و دارو و کدخوان بارکد دیجیتال استاندارد.',
          technicalCode: `gs1_barcode_data = g_date.strftime('%y%m%d') # Standard GS1 format`,
        },
      ],
    },
    {
      id: 'mrp',
      name: 'تولید و سفارشات ساخت',
      enName: 'Manufacturing & MRP',
      icon: <Cpu className="w-5 h-5 text-rose-600" />,
      badge: '۲ نقطه شکست برنامه‌ریزی',
      description:
        'مدیریت خطوط تولید و کارخانجات؛ هماهنگی ایستگاه‌های کاری با تقویم تعطیلات کشور.',
      flaws: [
        {
          title: 'برنامه‌ریزی شیفت مونتاژ در صبح روز جمعه (Resource Calendar Conflict)',
          scenario:
            'اودوو شنبه و یکشنبه را روزهای تعطیل در نظر می‌گیرد. در کارخانجات ایران روزهای پنج‌شنبه و جمعه تعطیل هستند و سیستم سفارش ساخت را برای جمعه زمان‌بندی می‌کند.',
          impact: 'خالی ماندن خطوط تولید و تاخیر ناخواسته در تحویل سفارشات تیراژ بالا.',
          severity: 'بحرانی (Fatal)',
          zarvanFix:
            'تنظیم خودکار تقویم منابع کاری کارخانه با مدل res.company و متد is_weekend زروان.',
          technicalCode: `is_off = company.is_weekend(weekday=p_weekday, company_id=cid)`,
        },
        {
          title: 'زمان‌بندی سرویس‌های دوره‌ای ماشین‌آلات (Preventive Maintenance)',
          scenario:
            'دستورهای تعمیرات ۳ ماهه با تغییر فصول و تعطیلات نوروز همگام نمی‌شوند و در زمان پیک تولید نوروز متوقف می‌شوند.',
          impact: 'توقف ناگهانی خط تولید به دلیل همزمانی اورهال با تحویل بار شب عید.',
          severity: 'متوسط (Medium)',
          zarvanFix:
            'تعریف مرزهای فصلی خورشیدی در سفارشات نگهداری و تعمیرات (Odoo Maintenance).',
          technicalCode: `next_pm_date = service.get_jalali_period_date_range('quarter', y, q)['end_date']`,
        },
      ],
    },
    {
      id: 'hr',
      name: 'منابع انسانی، حقوق و دستمزد',
      enName: 'HR & Payroll',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      badge: '۳ نقطه شکست قانون کار',
      description:
        'محاسبات دقیق کارکرد پرسنل منطبق بر قانون کار و تامین اجتماعی جمهوری اسلامی ایران.',
      flaws: [
        {
          title: 'محاسبه مضاعف فوق‌العاده جمعه‌کاری و تعطیل‌کاری (Payroll Overlap)',
          scenario:
            'هنگامی که عید غدیر یا ۲۲ بهمن مصادف با روز جمعه باشد، سیستم‌های سنتی یک روز را دو بار در فیش حقوقی لحاظ می‌کنند (۸۰٪ به جای ۴۰٪ فوق‌العاده).',
          impact: 'زیان مالی قابل توجه کارفرما در شرکت‌های با پرسنل چندصد نفره.',
          severity: 'بحرانی (Fatal)',
          zarvanFix:
            'متد get_working_days_in_month روزها را به ۳ دسته کاری، جمعه‌ها، و تعطیلات غیرجمعه تفکیک می‌کند.',
          technicalCode: `holiday_days = non_weekend_holidays # Never double-counted`,
        },
        {
          title: 'جابجایی روز تردد شیفت شب پرسنل (Attendance Night Shift Drift)',
          scenario:
            'ترددهایی که بین ساعت ۰۰:۰۰ تا ۰۳:۳۰ بامداد ثبت می‌شوند، به دلیل عدم انطباق با تایم‌زون ایران در کارکرد روز قبل پرسنل منظور می‌شوند.',
          impact: 'کسر کار کاذب برای شیفت شب و نارضایتی شدید کارگران خط تولید.',
          severity: 'بالا (High)',
          zarvanFix:
            'تصحیح مرز زمانی لاگ‌های تردد در لایه دیتابیس با احتساب ساعت رسمی ایران.',
          technicalCode: `punch_utc = local_tz.localize(dt).astimezone(pytz.UTC)`,
        },
        {
          title: 'تداخل زمان ذخیره مرخصی ماهانه ۲.۵ روز (Leave Accrual Cutoff)',
          scenario:
            'کران‌جاب تخصیص مرخصی ماهانه در پایان ماه‌های میلادی (مانند ۲۸ فوریه) اجرا شده و کارکرد ماه جاری را ناقص محاسبه می‌کند.',
          impact: 'اختلاف در مانده مرخصی سالانه هنگام تسویه‌حساب پرسنل.',
          severity: 'متوسط (Medium)',
          zarvanFix:
            'اجرای اتوماسیون مرخصی با شرط is_last_day_of_jalali_month در آخرین روز ماه شمسی.',
          technicalCode: `if service.is_last_day_of_jalali_month(): run_leave_accrual()`,
        },
      ],
    },
    {
      id: 'pos',
      name: 'صندوق‌های فروشگاهی',
      enName: 'Point of Sale (POS)',
      icon: <Store className="w-5 h-5 text-blue-600" />,
      badge: '۲ نقطه شکست فروش حضوری',
      description:
        'محیط خرده‌فروشی و فروشگاه‌های زنجیره‌ای؛ پایداری مطلق در زمان قطعی اینترنت و سرعت زیر ۵ میلی‌ثانیه.',
      flaws: [
        {
          title: 'قفل شدن صندوق در حالت قطعی اینترنت (Offline POS Failure)',
          scenario:
            'در صورت قطع اینترنت، ماژول‌هایی که تاریخ را با RPC سرور تبدیل می‌کردند، صفحه صدور فاکتور را قفل و بلاک می‌کنند.',
          impact: 'تشکیل صف طولانی مشتریان و توقف کامل فروش در فروشگاه‌های بزرگ.',
          severity: 'بحرانی (Fatal)',
          zarvanFix:
            'موتور تبدیل ۱۰۰٪ کلاینت‌ساید بیت‌وایز O(1) در مرورگر بدون نیاز به سرور و اینترنت.',
          technicalCode: `cacheKey = (gy << 9) | (gm << 5) | gd; # 0-Network Latency`,
        },
        {
          title: 'تفکیک فروش روزانه در بستن صندوق بعد از نیمه‌شب (Z-Report Shift)',
          scenario:
            'فروشگاه‌هایی که شیفت کاری آن‌ها تا ۱ بامداد ادامه دارد، با ورود به روز جدید تاریخ فاکتور تغییر کرده و گزارش فروش دو روز ادغام می‌شود.',
          impact: 'مغایرت صندوق فیزیکی با گردش پوز بانکی و عدم تطابق اسناد صندوقدار.',
          severity: 'بالا (High)',
          zarvanFix:
            'ثبت تاریخ جلسه کاری POS (pos.session) بر اساس تاریخ شروع شیفت صندوقدار.',
          technicalCode: `receipt_date = session.start_date_jalali`,
        },
      ],
    },
    {
      id: 'sale_crm',
      name: 'فروش و بازاریابی',
      enName: 'Sales & CRM',
      icon: <ShoppingCart className="w-5 h-5 text-purple-600" />,
      badge: '۲ نقطه شکست تجاری',
      description:
        'خط مقدم تعامل با مشتری؛ هماهنگی اعتبار پیش‌فاکتورها و اهداف فصلی تیم فروش.',
      flaws: [
        {
          title: 'انقضای پیش‌فاکتور مشتری در روز تعطیل (Quotation Validity Over Weekend)',
          scenario:
            'پیش‌فاکتور با مهلت ۷ روزه که در روز چهارشنبه صادر شده، در پایان روز جمعه منقضی می‌شود بدون این که مشتری امکان واریز وجه در روز کاری را داشته باشد.',
          impact: 'از دست رفتن معاملات تجاری و نارضایتی مشتریان سازمانی.',
          severity: 'متوسط (Medium)',
          zarvanFix:
            'امکان محاسبه سررسید بر مبنای روزهای کاری خالص با کسر تعطیلات رسمی ثبت‌شده در زروان.',
          technicalCode: `deadline = service.add_working_days(order_date, days=7)`,
        },
        {
          title: 'تقسیم تارگت‌های فروش بین دو ماه میلادی در پایپ‌لاین CRM',
          scenario:
            'نمودار فروش ماهانه در CRM، فروش ۱۰ روز اول فروردین را در ستون مارس و مابقی را در آوریل نمایش می‌دهد.',
          impact: 'عدم امکان ارزیابی دقیق پورسانت و کارایی کارشناسان فروش در ماه‌های خورشیدی.',
          severity: 'بالا (High)',
          zarvanFix:
            'میکسین JalaaliGroupByMixin داده‌های پایپ‌لاین را بر اساس ماه واقعی شمسی دسته‌بندی می‌کند.',
          technicalCode: `search_group_by = ['jalali_group_year', 'jalali_group_month']`,
        },
      ],
    },
    {
      id: 'project',
      name: 'پروژه و خدمات فنی',
      enName: 'Project & Timesheets',
      icon: <FolderGit2 className="w-5 h-5 text-teal-600" />,
      badge: '۲ نقطه شکست مدیریت پروژه',
      description:
        'مدیریت وظایف، تخصیص منابع و جدول زمان‌بندی هفتگی پرسنل فنی و مهندسی.',
      flaws: [
        {
          title: 'به‌هم‌ریختگی جدول هفتگی تایم‌شیت (Monday vs Saturday Week Start)',
          scenario:
            'تایم‌شیت پیش‌فرض اودوو هفته را از دوشنبه تا یکشنبه نمایش می‌دهد؛ ثبت ساعات کاری پنج‌شنبه و جمعه پرسنل دچار سردرگمی می‌شود.',
          impact: 'خطای محاسباتی در ساعت‌کار پروژه‌ها و صورت‌حساب مشتریان خدمات فنی.',
          severity: 'بالا (High)',
          zarvanFix:
            'شروع هفته از روز شنبه با تقویم فارسی و تفکیک رنگی روزهای تعطیل آخر هفته.',
          technicalCode: `week_starts_on = 'saturday' # Persian standard work-week`,
        },
        {
          title: 'پرش خطوط وابستگی در گانت چارت پروژه‌ها (Gantt Chart Lag)',
          scenario:
            'در نمای گانت اینترپرایز، کشیدن تسک‌ها برای به تعویق انداختن، روزهای تعطیل ایران را نادیده گرفته و پایان پروژه را زودتر تخمین می‌زند.',
          impact: 'خلف وعده در تحویل پروژه‌های عمرانی، ساختمانی و نرم‌افزاری.',
          severity: 'متوسط (Medium)',
          zarvanFix:
            'محاسبه وابستگی‌ها بر اساس تقویم شیفت کاری ایرانی شرکت.',
          technicalCode: `task_end = calendar.plan_hours(task_start, duration_hours)`,
        },
      ],
    },
    {
      id: 'spreadsheet',
      name: 'اسپردشیت و اسناد تحلیلی',
      enName: 'Documents & Spreadsheet',
      icon: <FileSpreadsheet className="w-5 h-5 text-cyan-600" />,
      badge: '۲ نقطه شکست فرمول‌نویسی',
      description:
        'محیط اسناد و تحلیل‌های مالی پیشرفته Odoo Enterprise؛ سازگاری ۱۰۰٪ با فرمول‌های اکسل.',
      flaws: [
        {
          title: 'خطای #VALUE! در فرمول‌های تجمیعی (SUMIFS / NPV / XIRR)',
          scenario:
            'ماژول‌هایی که خروجی فرمول تقویم را به شکل متن بازمی‌گردانند، محاسبات مالی اکسل اودوو را با خطای #VALUE! متوقف می‌کنند.',
          impact: 'از کار افتادن مدل‌های مالی و پیش‌بینی بودجه سالانه در اکسل‌های اینترپرایز.',
          severity: 'بحرانی (Fatal)',
          zarvanFix:
            'فرمول‌های =JDATE مقدار استاندارد عدد سریال اکسل (Serial Number) را بازمی‌گردانند.',
          technicalCode: `return dateToSerial(gYear, gMonth, gDay); # Valid Serial Float`,
        },
        {
          title: 'خطای ۲۹ اسفند در سال‌های کبیسه فرمول =JEOMONTH',
          scenario:
            'فرمول‌های اکسل که طول اسفند را بدون محاسبه نجومی ثابت ۲۹ روز می‌گیرند، در سال‌های کبیسه روز ۳۰ اسفند را حذف می‌کنند.',
          impact: 'ثبت نشدن تراکنش‌های آخرین روز سال در صورت‌های مالی شرکت.',
          severity: 'بالا (High)',
          zarvanFix:
            'محاسبه دقیق چرخه ۳۳ ساله خیامی در فرمول‌های جاوااسکریپتی ES Module اسپردشیت.',
          technicalCode: `const maxDays = isLeapJalali(jy) ? 30 : 29;`,
        },
      ],
    },
  ];

  const currentMod = modulesData.find((m) => m.id === selectedModule) || modulesData[0];

  return (
    <div className="space-y-6">
      {/* Module Selector Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">
              موشکافی تخصصی ماژول‌به‌ماژول اکوسیستم Odoo 20:
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            بررسی نقاط شکست، پیامدهای مالی و راهکارهای معمارانه زروان
          </span>
        </div>

        {/* Module Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {modulesData.map((m) => {
            const isSelected = m.id === selectedModule;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModule(m.id)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1.5 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{m.icon}</span>
                <span className="truncate w-full text-[11px]">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Module Detail Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="p-3 bg-slate-100 rounded-2xl">{currentMod.icon}</span>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-lg font-bold text-slate-900">{currentMod.name}</h3>
                <span className="text-xs text-slate-400 font-mono">({currentMod.enName})</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentMod.description}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-bold">
            {currentMod.badge}
          </span>
        </div>

        {/* Flaws for this module */}
        <div className="space-y-4">
          {currentMod.flaws.map((flaw, idx) => (
            <div
              key={idx}
              className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 hover:border-slate-300 transition-all text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 space-x-reverse">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                    {idx + 1}
                  </span>
                  <span>{flaw.title}</span>
                </h4>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                    flaw.severity.startsWith('بحرانی')
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : flaw.severity.startsWith('بالا')
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}
                >
                  {flaw.severity}
                </span>
              </div>

              {/* Scenario & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1 text-rose-950">
                  <span className="font-bold flex items-center space-x-1.5 space-x-reverse text-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>سناریوی شکست در سایر ماژول‌ها:</span>
                  </span>
                  <p className="leading-relaxed text-[11px]">{flaw.scenario}</p>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-amber-950">
                  <span className="font-bold flex items-center space-x-1.5 space-x-reverse text-amber-900">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>پیامد سازمانی و ریسک مالیاتی/حقوقی:</span>
                  </span>
                  <p className="leading-relaxed text-[11px]">{flaw.impact}</p>
                </div>
              </div>

              {/* Zarvan Solution */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950">
                <span className="font-bold flex items-center space-x-1.5 space-x-reverse text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>راهکار مصون‌سازی قطعی در زروان (Odoo 20 Architecture):</span>
                </span>
                <p className="leading-relaxed text-[11px]">{flaw.zarvanFix}</p>
              </div>

              {/* Code Snippet */}
              {flaw.technicalCode && (
                <div className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed" dir="ltr">
                  {flaw.technicalCode}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
