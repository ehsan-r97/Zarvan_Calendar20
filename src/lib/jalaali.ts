import jalaali from 'jalaali-js';

export interface JalaaliDate {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export const PERSIAN_MONTHS = [
  { id: 1, name: 'فروردین (۱)', baseName: 'فروردین', latin: 'Farvardin (01)', season: 'بهار (Spring)', days: 31 },
  { id: 2, name: 'اردیبهشت (۲)', baseName: 'اردیبهشت', latin: 'Ordibehesht (02)', season: 'بهار (Spring)', days: 31 },
  { id: 3, name: 'خرداد (۳)', baseName: 'خرداد', latin: 'Khordad (03)', season: 'بهار (Spring)', days: 31 },
  { id: 4, name: 'تیر (۴)', baseName: 'تیر', latin: 'Tir (04)', season: 'تابستان (Summer)', days: 31 },
  { id: 5, name: 'مرداد (۵)', baseName: 'مرداد', latin: 'Mordad (05)', season: 'تابستان (Summer)', days: 31 },
  { id: 6, name: 'شهریور (۶)', baseName: 'شهریور', latin: 'Shahrivar (06)', season: 'تابستان (Summer)', days: 31 },
  { id: 7, name: 'مهر (۷)', baseName: 'مهر', latin: 'Mehr (07)', season: 'پاییز (Autumn)', days: 30 },
  { id: 8, name: 'آبان (۸)', baseName: 'آبان', latin: 'Aban (08)', season: 'پاییز (Autumn)', days: 30 },
  { id: 9, name: 'آذر (۹)', baseName: 'آذر', latin: 'Azar (09)', season: 'پاییز (Autumn)', days: 30 },
  { id: 10, name: 'دی (۱۰)', baseName: 'دی', latin: 'Dey (10)', season: 'زمستان (Winter)', days: 30 },
  { id: 11, name: 'بهمن (۱۱)', baseName: 'بهمن', latin: 'Bahman (11)', season: 'زمستان (Winter)', days: 30 },
  { id: 12, name: 'اسفند (۱۲)', baseName: 'اسفند', latin: 'Esfand (12)', season: 'زمستان (Winter)', days: 29 }, // 30 in leap
];

export const GREGORIAN_MONTHS = [
  { id: 1, name: 'January (01)', short: 'Jan (01)' },
  { id: 2, name: 'February (02)', short: 'Feb (02)' },
  { id: 3, name: 'March (03)', short: 'Mar (03)' },
  { id: 4, name: 'April (04)', short: 'Apr (04)' },
  { id: 5, name: 'May (05)', short: 'May (05)' },
  { id: 6, name: 'June (06)', short: 'Jun (06)' },
  { id: 7, name: 'July (07)', short: 'Jul (07)' },
  { id: 8, name: 'August (08)', short: 'Aug (08)' },
  { id: 9, name: 'September (09)', short: 'Sep (09)' },
  { id: 10, name: 'October (10)', short: 'Oct (10)' },
  { id: 11, name: 'November (11)', short: 'Nov (11)' },
  { id: 12, name: 'December (12)', short: 'Dec (12)' },
];

export const PERSIAN_WEEKDAYS = [
  { index: 0, name: 'شنبه', short: 'ش', latin: 'Shanbeh', english: 'Saturday' },
  { index: 1, name: 'یکشنبه', short: 'ی', latin: 'Yekshanbeh', english: 'Sunday' },
  { index: 2, name: 'دوشنبه', short: 'د', latin: 'Doshanbeh', english: 'Monday' },
  { index: 3, name: 'سه‌شنبه', short: 'س', latin: 'Seshanbeh', english: 'Tuesday' },
  { index: 4, name: 'چهارشنبه', short: 'چ', latin: 'Chaharshanbeh', english: 'Wednesday' },
  { index: 5, name: 'پنج‌شنبه', short: 'پ', latin: 'Panjshanbeh', english: 'Thursday' },
  { index: 6, name: 'جمعه', short: 'ج', latin: 'Jomeh', english: 'Friday' },
];

export function toPersianDigits(value: string | number): string {
  // Enforce English (Latin) digits across the entire application per user requirement
  return toLatinDigits(String(value));
}

export function toLatinDigits(value: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = String(value);
  persianDigits.forEach((pd, i) => {
    res = res.replace(new RegExp(pd, 'g'), String(i));
  });
  arabicDigits.forEach((ad, i) => {
    res = res.replace(new RegExp(ad, 'g'), String(i));
  });
  return res;
}

export function isLeapYear(year: number): boolean {
  return jalaali.isLeapJalaaliYear(year);
}

export function getDaysInJalaaliMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 30;
  return jalaali.jalaaliMonthLength(year, month);
}

export function jalaaliToGregorian(jy: number, jm: number, jd: number): GregorianDate | null {
  try {
    if (!jalaali.isValidJalaaliDate(jy, jm, jd)) {
      return null;
    }
    const res = jalaali.toGregorian(jy, jm, jd);
    return {
      year: res.gy,
      month: res.gm,
      day: res.gd,
    };
  } catch {
    return null;
  }
}

export function gregorianToJalaali(gy: number, gm: number, gd: number): JalaaliDate | null {
  try {
    const res = jalaali.toJalaali(gy, gm, gd);
    return {
      year: res.jy,
      month: res.jm,
      day: res.jd,
    };
  } catch {
    return null;
  }
}

/**
 * Returns weekday index in Jalali week (0 = Saturday, 6 = Friday)
 */
export function getJalaaliWeekday(jy: number, jm: number, jd: number): number {
  const greg = jalaaliToGregorian(jy, jm, jd);
  if (!greg) return 0;
  const jsDate = new Date(greg.year, greg.month - 1, greg.day);
  // jsDate.getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
  // Persian: Saturday=0, Sunday=1, ..., Friday=6
  const jsDay = jsDate.getDay();
  return (jsDay + 1) % 7;
}

export function getCurrentJalaaliDate(): JalaaliDate & {
  weekday: number;
  weekdayName: string;
  formatted: string;
  persianFormatted: string;
  gregorianDate: string;
} {
  const now = new Date();
  const res = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const jsDay = now.getDay();
  const weekday = (jsDay + 1) % 7;
  const formatted = `${res.jy}/${String(res.jm).padStart(2, '0')}/${String(res.jd).padStart(2, '0')}`;
  const gregFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return {
    year: res.jy,
    month: res.jm,
    day: res.jd,
    weekday,
    weekdayName: PERSIAN_WEEKDAYS[weekday].name,
    formatted,
    persianFormatted: toPersianDigits(formatted),
    gregorianDate: gregFormatted,
  };
}

export function formatDate(
  year: number,
  month: number,
  day: number,
  format: string = 'YYYY/MM/DD',
  usePersianNumbers: boolean = false,
  mode: 'shamsi' | 'gregorian' | 'both' = 'shamsi'
): string {
  const yStr = String(year);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');

  let shamsiStr = format
    .replace('YYYY', yStr)
    .replace('MM', mStr)
    .replace('DD', dStr);

  if (usePersianNumbers) {
    shamsiStr = toPersianDigits(shamsiStr);
  }

  const greg = jalaaliToGregorian(year, month, day);
  const gIso = greg
    ? `${greg.year}-${String(greg.month).padStart(2, '0')}-${String(greg.day).padStart(2, '0')}`
    : '';

  if (mode === 'gregorian') {
    return gIso;
  }
  if (mode === 'both') {
    return `${shamsiStr} (${gIso})`;
  }
  return shamsiStr;
}

export function formatUserDate(
  year: number,
  month: number,
  day: number,
  preferences: {
    calendar_mode?: 'shamsi' | 'gregorian' | 'both';
    date_format?: string;
    use_persian_numbers?: boolean;
  }
): string {
  return formatDate(
    year,
    month,
    day,
    preferences.date_format || 'YYYY/MM/DD',
    Boolean(preferences.use_persian_numbers),
    preferences.calendar_mode || 'shamsi'
  );
}

const PERSIAN_MONTH_NAMES_MAP: Record<string, number> = {
  'فروردین': 1, 'اردیبهشت': 2, 'خرداد': 3,
  'تیر': 4, 'مرداد': 5, 'شهریور': 6,
  'مهر': 7, 'آبان': 8, 'آذر': 9,
  'دی': 10, 'بهمن': 11, 'اسفند': 12,
  'farvardin': 1, 'ordibehesht': 2, 'khordad': 3,
  'tir': 4, 'mordad': 5, 'shahrivar': 6,
  'mehr': 7, 'aban': 8, 'azar': 9,
  'dey': 10, 'bahman': 11, 'esfand': 12,
};

export function parseDateString(str: string): {
  isJalali: boolean;
  year: number;
  month: number;
  day: number;
  gregorian: string;
  jalali: string;
} | null {
  if (!str) return null;
  const cleaned = toLatinDigits(str.trim());

  let y = 0;
  let m = 0;
  let d = 0;

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (with optional HH:mm[:ss])
  const match1 = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+\d{1,2}:\d{1,2}(?::\d{1,2})?)?$/);
  if (match1) {
    y = parseInt(match1[1], 10);
    m = parseInt(match1[2], 10);
    d = parseInt(match1[3], 10);
  } else {
    // Pattern 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
    const match2 = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+\d{1,2}:\d{1,2}(?::\d{1,2})?)?$/);
    if (match2) {
      d = parseInt(match2[1], 10);
      m = parseInt(match2[2], 10);
      y = parseInt(match2[3], 10);
    } else {
      // Pattern 3: YYYYMMDD (8 digits continuous)
      const match3 = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
      if (match3) {
        y = parseInt(match3[1], 10);
        m = parseInt(match3[2], 10);
        d = parseInt(match3[3], 10);
      } else {
        // Pattern 4: Named Month e.g. "15 فروردین 1405" or "15 farvardin 1405"
        let foundMonth = 0;
        const lower = cleaned.toLowerCase();
        for (const [name, num] of Object.entries(PERSIAN_MONTH_NAMES_MAP)) {
          if (lower.includes(name)) {
            foundMonth = num;
            break;
          }
        }

        if (foundMonth > 0) {
          const numbers = cleaned.match(/\d+/g);
          if (numbers && numbers.length >= 2) {
            const numVals = numbers.map((n) => parseInt(n, 10));
            const yearVal = numVals.find((n) => n >= 1300 && n <= 1500);
            const dayVal = numVals.find((n) => n >= 1 && n <= 31 && n !== yearVal);
            if (yearVal && dayVal) {
              y = yearVal;
              m = foundMonth;
              d = dayVal;
            } else {
              return null;
            }
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
    }
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  // If year < 1500, assume Jalali
  const isJalali = y < 1500;
  if (isJalali) {
    const greg = jalaaliToGregorian(y, m, d);
    if (!greg) return null;
    return {
      isJalali: true,
      year: y,
      month: m,
      day: d,
      jalali: `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`,
      gregorian: `${greg.year}-${String(greg.month).padStart(2, '0')}-${String(greg.day).padStart(2, '0')}`,
    };
  } else {
    const jal = gregorianToJalaali(y, m, d);
    if (!jal) return null;
    return {
      isJalali: false,
      year: y,
      month: m,
      day: d,
      gregorian: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      jalali: `${jal.year}/${String(jal.month).padStart(2, '0')}/${String(jal.day).padStart(2, '0')}`,
    };
  }
}
