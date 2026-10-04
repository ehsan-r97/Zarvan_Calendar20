import { jalaaliToGregorian } from '../lib/jalaali';

export interface HolidayRecord {
  id: string;
  name: string;
  jalali_year: number | null; // null = fixed every year
  jalali_month: number;
  jalali_day: number;
  holiday_type: 'fixed' | 'lunar' | 'regional' | 'national';
  is_national: boolean;
  is_active: boolean;
  description?: string;
  company_id?: number | null;
  gregorian_date?: string;
}

export const INITIAL_HOLIDAYS: HolidayRecord[] = [
  // Fixed National Holidays (Applicable to every year)
  {
    id: 'nowruz_1',
    name: 'آغاز سال نو (جشن نوروز)',
    jalali_year: null,
    jalali_month: 1,
    jalali_day: 1,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'اولین روز عید باستانی نوروز',
  },
  {
    id: 'nowruz_2',
    name: 'عید نوروز (روز دوم)',
    jalali_year: null,
    jalali_month: 1,
    jalali_day: 2,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'دومین روز تعطیلات نوروز',
  },
  {
    id: 'nowruz_3',
    name: 'عید نوروز (روز سوم)',
    jalali_year: null,
    jalali_month: 1,
    jalali_day: 3,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'سومین روز تعطیلات نوروز',
  },
  {
    id: 'nowruz_4',
    name: 'عید نوروز (روز چهارم)',
    jalali_year: null,
    jalali_month: 1,
    jalali_day: 4,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'چهارمین روز تعطیلات نوروز',
  },
  {
    id: 'islamic_republic',
    name: 'روز جمهوری اسلامی',
    jalali_year: null,
    jalali_month: 1,
    jalali_day: 12,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: '۱۲ فروردین روز جمهوری اسلامی',
  },
  {
    id: 'sizdah_bedar',
    name: 'سیزده به در (روز طبیعت)',
    jalali_year: null,
    jalali_month: 1,
    jalali_day: 13,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'جشن باستانی سیزده‌به‌در',
  },
  {
    id: 'khomeini_death',
    name: 'رحلت امام خمینی (ره)',
    jalali_year: null,
    jalali_month: 3,
    jalali_day: 14,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: '۱۴ خرداد سالروز رحلت بنیان‌گذار جمهوری اسلامی',
  },
  {
    id: 'khordad_uprising',
    name: 'قیام ۱۵ خرداد',
    jalali_year: null,
    jalali_month: 3,
    jalali_day: 15,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'قیام خونین ۱۵ خرداد ۱۳۴۲',
  },
  {
    id: 'beheshti_martyrdom',
    name: 'شهادت دکتر بهشتی (۷ تیر)',
    jalali_year: null,
    jalali_month: 4,
    jalali_day: 7,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'سالروز شهادت آیت‌الله بهشتی و ۷۲ تن از یارانش',
  },
  {
    id: 'student_day',
    name: 'روز دانشجو (۱۶ آذر)',
    jalali_year: null,
    jalali_month: 9,
    jalali_day: 16,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'روز دانشجو و گرامیداشت شهدای ۱۶ آذر',
  },
  {
    id: 'revolution_day',
    name: 'پیروزی انقلاب اسلامی (۲۲ بهمن)',
    jalali_year: null,
    jalali_month: 11,
    jalali_day: 22,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'سالروز پیروزی انقلاب اسلامی ایران',
  },
  {
    id: 'oil_nationalization',
    name: 'روز ملی شدن صنعت نفت (۲۹ اسفند)',
    jalali_year: null,
    jalali_month: 12,
    jalali_day: 29,
    holiday_type: 'fixed',
    is_national: true,
    is_active: true,
    description: 'سالروز ملی شدن صنعت نفت ایران',
  },

  // Lunar Holidays for 1404
  {
    id: '1404_ashura',
    name: 'عاشورای حسینی - ۱۴۰۴',
    jalali_year: 1404,
    jalali_month: 6,
    jalali_day: 17,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۱۰ محرم، عاشورای حضرت اباعبدالله الحسین (ع)',
  },
  {
    id: '1404_arbaeen',
    name: 'اربعین حسینی - ۱۴۰۴',
    jalali_year: 1404,
    jalali_month: 7,
    jalali_day: 7,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۲۰ صفر، اربعین سیدالشهدا (ع)',
  },
  {
    id: '1404_prophet',
    name: 'رحلت پیامبر اکرم (ص) و شهادت امام حسن (ع) - ۱۴۰۴',
    jalali_year: 1404,
    jalali_month: 10,
    jalali_day: 8,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۲۸ صفر، رحلت رسول اکرم (ص)',
  },
  {
    id: '1404_reza',
    name: 'شهادت امام رضا (ع) - ۱۴۰۴',
    jalali_year: 1404,
    jalali_month: 10,
    jalali_day: 30,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: 'آخر ماه صفر، شهادت علی بن موسی الرضا (ع)',
  },
  {
    id: '1404_fatimiyyah',
    name: 'شهادت حضرت فاطمه زهرا (س) - ۱۴۰۴',
    jalali_year: 1404,
    jalali_month: 11,
    jalali_day: 15,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: 'ایام فاطمیه و شهادت حضرت زهرا (س)',
  },

  // Lunar Holidays for 1405 (CURRENT YEAR)
  {
    id: '1405_tasua',
    name: 'تاسوعای حسینی - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 6,
    jalali_day: 6,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۹ محرم، تاسوعای حسینی',
  },
  {
    id: '1405_ashura',
    name: 'عاشورای حسینی - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 6,
    jalali_day: 7,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۱۰ محرم، شهادت سالار شهیدان (ع)',
  },
  {
    id: '1405_arbaeen',
    name: 'اربعین حسینی - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 6,
    jalali_day: 27,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۲۰ صفر، چهلم شهدای کربلا',
  },
  {
    id: '1405_prophet',
    name: 'رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع) - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 9,
    jalali_day: 28,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۲۸ صفر، سالروز وفات پیامبر اسلام',
  },
  {
    id: '1405_reza',
    name: 'شهادت امام علی بن موسی الرضا (ع) - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 10,
    jalali_day: 20,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: 'آخر صفر، سالروز شهادت امام هشتم شیعیان',
  },
  {
    id: '1405_fatimiyyah',
    name: 'شهادت حضرت فاطمه زهرا (س) - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 11,
    jalali_day: 5,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۳ جمادی‌الثانی، شهادت صدیقه طاهره (س)',
  },
  {
    id: '1405_ali_birth',
    name: 'ولادت امام علی (ع) و روز پدر - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 11,
    jalali_day: 24,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۱۳ رجب، ولادت امیرالمومنین علی (ع)',
  },
  {
    id: '1405_mabath',
    name: 'مبعث حضرت رسول اکرم (ص) - ۱۴۰۵',
    jalali_year: 1405,
    jalali_month: 12,
    jalali_day: 8,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۲۷ رجب، عید سعید مبعث پیامبر اعظم',
  },

  // Lunar Holidays for 1406
  {
    id: '1406_ashura',
    name: 'عاشورای حسینی - ۱۴۰۶',
    jalali_year: 1406,
    jalali_month: 5,
    jalali_day: 27,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۱۰ محرم ۱۴۴۸ هجری قمری',
  },
  {
    id: '1406_arbaeen',
    name: 'اربعین حسینی - ۱۴۰۶',
    jalali_year: 1406,
    jalali_month: 6,
    jalali_day: 16,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۲۰ صفر ۱۴۴۸ هجری قمری',
  },
  {
    id: '1406_prophet',
    name: 'رحلت پیامبر اکرم (ص) - ۱۴۰۶',
    jalali_year: 1406,
    jalali_month: 9,
    jalali_day: 18,
    holiday_type: 'lunar',
    is_national: true,
    is_active: true,
    description: '۲۸ صفر ۱۴۴۸ هجری قمری',
  },
];

export interface CompanySetting {
  id: number;
  name: string;
  jalali_weekend_type: 'friday' | 'thu_fri' | 'custom';
  jalali_weekend_custom: string; // e.g. "5,6" (0=Sat ... 6=Fri)
  fiscal_year_start_month: number; // 1-12 (e.g. 1 = Farvardin)
  auto_create_holidays: boolean;
}

export const INITIAL_COMPANIES: CompanySetting[] = [
  {
    id: 1,
    name: 'شرکت فناوری زروان (اصلی)',
    jalali_weekend_type: 'thu_fri',
    jalali_weekend_custom: '5,6',
    fiscal_year_start_month: 1,
    auto_create_holidays: true,
  },
  {
    id: 2,
    name: 'شعبه بین‌الملل (شنبه و یکشنبه)',
    jalali_weekend_type: 'custom',
    jalali_weekend_custom: '0,1',
    fiscal_year_start_month: 10,
    auto_create_holidays: false,
  },
  {
    id: 3,
    name: 'سازمان دولتی (فقط جمعه)',
    jalali_weekend_type: 'friday',
    jalali_weekend_custom: '6',
    fiscal_year_start_month: 1,
    auto_create_holidays: true,
  },
];

export interface UserPreferences {
  calendar_mode: 'shamsi' | 'gregorian' | 'both';
  date_format: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'YYYYMMDD' | 'DD-MM-YYYY' | 'DD/MM/YYYY';
  show_gregorian: boolean;
  use_persian_numbers: boolean;
  default_view: 'jalali' | 'gregorian';
}

export const INITIAL_PREFERENCES: UserPreferences = {
  calendar_mode: 'shamsi',
  date_format: 'YYYY/MM/DD',
  show_gregorian: true,
  use_persian_numbers: false,
  default_view: 'jalali',
};
