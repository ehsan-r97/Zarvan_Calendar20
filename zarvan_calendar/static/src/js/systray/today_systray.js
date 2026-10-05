/** @odoo-module **/

import { Component, useState, onMounted, onWillUnmount, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { user } from "@web/core/user";
import { useService } from "@web/core/utils/hooks";

/**
 * Top Navbar Systray Widget for Odoo 20
 * Displays today's Shamsi date, Persian weekday, and holiday badge directly
 * in the Odoo top header bar with a fast popover details panel.
 */
export class ZarvanTodaySystray extends Component {
    static template = "zarvan_calendar.ZarvanTodaySystray";

    setup() {
        this.action = useService("action");
        this.rootRef = useRef("root");
        this.state = useState({
            isOpen: false,
            jalaliDate: "",
            jalaliNumeric: "",
            weekdayName: "",
            gregorianDate: "",
            isHoliday: false,
            holidayName: "",
            converterInput: "",
            converterOutput: "",
        });

        this.boundOnDocumentClick = (ev) => {
            if (this.state.isOpen && this.rootRef.el && !this.rootRef.el.contains(ev.target)) {
                this.state.isOpen = false;
            }
        };

        onMounted(() => {
            this.calculateToday();
            document.addEventListener('click', this.boundOnDocumentClick);
        });

        onWillUnmount(() => {
            document.removeEventListener('click', this.boundOnDocumentClick);
        });
    }

    calculateToday() {
        const now = new Date();
        const gy = now.getFullYear();
        const gm = now.getMonth() + 1;
        const gd = now.getDate();

        // Convert to Jalali
        const j = this.gregorianToJalali(gy, gm, gd);
        const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
        const dayIdx = now.getDay(); // 0 = Sunday
        const weekday = weekdays[dayIdx];

        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];

        this.state.weekdayName = weekday;
        this.state.jalaliDate = `${j.day} ${monthNames[j.month - 1]} ${j.year}`;
        this.state.jalaliNumeric = `${j.year}/${String(j.month).padStart(2, '0')}/${String(j.day).padStart(2, '0')}`;
        this.state.gregorianDate = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;

        // Friday is default weekend
        if (dayIdx === 5) {
            this.state.isHoliday = true;
            this.state.holidayName = "جمعه (تعطیل پایان هفته)";
        }
    }

    onConverterInput(ev) {
        const val = ev.target.value.trim();
        this.state.converterInput = val;
        if (!val) {
            this.state.converterOutput = "";
            return;
        }

        const toLatin = (s) => {
            const map = {
                '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
                '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
            };
            return String(s).replace(/[۰-۹٠-٩]/g, (w) => map[w] || w);
        };
        const cleanVal = window.__zarvan ? window.__zarvan.toLatinDigits(val) : toLatin(val);

        // Check if Gregorian (YYYY-MM-DD or YYYY/MM/DD with year > 1900)
        const parts = cleanVal.replace(/[-.]/g, '/').split('/');
        if (parts.length === 3) {
            const p1 = parseInt(parts[0], 10);
            const p2 = parseInt(parts[1], 10);
            const p3 = parseInt(parts[2], 10);

            if (p1 > 1900 && p2 >= 1 && p2 <= 12 && p3 >= 1 && p3 <= 31) {
                const j = this.gregorianToJalali(p1, p2, p3);
                this.state.converterOutput = `خورشیدی: ${j.year}/${String(j.month).padStart(2, '0')}/${String(j.day).padStart(2, '0')}`;
                return;
            } else if (p1 < 1500 && p2 >= 1 && p2 <= 12 && p3 >= 1 && p3 <= 31) {
                const g = this.jalaliToGregorian(p1, p2, p3);
                if (g) {
                    this.state.converterOutput = `میلادی: ${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`;
                    return;
                }
            }
        }
        this.state.converterOutput = "فرمت معتبر: 1405/01/15 یا 2026-03-21";
    }

    jalaliToGregorian(jy, jm, jd) {
        if (window.__zarvan && window.__zarvan.jalaliToGregorian) {
            return window.__zarvan.jalaliToGregorian(jy, jm, jd);
        }
        let gy = jy + 621;
        let days = (jm <= 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186) + jd - 1;
        let g_day_no = days + 20;
        const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
        const g_days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm = 3;
        while (g_day_no > g_days[gm - 1]) {
            g_day_no -= g_days[gm - 1];
            gm++;
            if (gm > 12) { gm = 1; gy++; }
        }
        return { year: gy, month: gm, day: g_day_no };
    }

    toggleDropdown() {
        this.state.isOpen = !this.state.isOpen;
    }

    closeDropdown() {
        this.state.isOpen = false;
    }

    openCalendar() {
        this.state.isOpen = false;
        this.action.doAction("zarvan_calendar.action_jalaali_holiday");
    }

    gregorianToJalali(gy, gm, gd) {
        if (window.__zarvan && window.__zarvan.gregorianToJalali) {
            return window.__zarvan.gregorianToJalali(gy, gm, gd);
        }
        const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let gy2 = (gm > 2) ? (gy + 1) : gy;
        let days = 355666 + (365 * gy) + ((gy2 + 3) >> 2) - ((gy2 + 99) / 100 | 0) + ((gy2 + 399) / 400 | 0) + gd + g_d_m[gm - 1];
        let jy = -1595 + (33 * (days / 12053 | 0));
        days %= 12053;
        jy += 4 * (days / 1461 | 0);
        days %= 1461;
        if (days > 365) {
            jy += ((days - 1) / 365 | 0);
            days = (days - 1) % 365;
        }
        let jm = (days < 186) ? 1 + (days / 31 | 0) : 7 + ((days - 186) / 30 | 0);
        let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        return { year: jy, month: jm, day: jd };
    }
}

export const zarvanTodaySystrayItem = {
    Component: ZarvanTodaySystray,
    isDisplayed: () => {
        const lang = user.lang || '';
        return lang.startsWith('fa') || user.jalali_calendar_mode !== 'gregorian';
    },
};

registry.category("systray").add("zarvan_today_systray", zarvanTodaySystrayItem, { sequence: 1 });
