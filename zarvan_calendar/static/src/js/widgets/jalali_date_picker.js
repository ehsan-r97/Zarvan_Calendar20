/** @odoo-module **/

import { Component, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { user } from "@web/core/user";

/**
 * Jalali Date Picker Widget - Odoo 20 & 19
 * Production OWL 3 & 2 component with mobile Bottom-Sheet and zero-RPC conversions.
 */
export class JalaliDatePicker extends Component {
    static template = "zarvan_calendar.JalaliDatePicker";
    static props = {
        ...standardFieldProps,
    };

    setup(props) {
        this.props = props || this.props;
        try {
            this.uiService = useService("ui");
        } catch (e) {
            this.uiService = null;
        }

        this.state = useState({
            isOpen: false,
            currentYear: 1405,
            currentMonth: 1,
            selectedDate: null,
            persianDisplay: '',
        });

        this.monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];

        this.weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
        this.boundOnDocumentClick = this.onDocumentClick.bind(this);

        onMounted(() => {
            this.parseInitialValue();
            document.addEventListener('click', this.boundOnDocumentClick);
        });

        onWillUnmount(() => {
            document.removeEventListener('click', this.boundOnDocumentClick);
        });
    }

    get isMobile() {
        return Boolean(
            (this.uiService && this.uiService.isSmall) ||
            (typeof window !== "undefined" && window.innerWidth < 768)
        );
    }

    closePicker() {
        this.state.isOpen = false;
    }

    parseInitialValue() {
        if (this.props.record.data[this.props.name]) {
            const val = this.props.record.data[this.props.name];
            const gDateStr = typeof val === 'string' ? val : (val.toISODate ? val.toISODate() : '');
            if (gDateStr) {
                const parts = gDateStr.split('-');
                if (parts.length === 3) {
                    const jDate = this.gregorianToJalali(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
                    if (jDate) {
                        this.state.currentYear = jDate.year;
                        this.state.currentMonth = jDate.month;
                        this.state.selectedDate = `${jDate.year}/${String(jDate.month).padStart(2, '0')}/${String(jDate.day).padStart(2, '0')}`;
                        this.state.persianDisplay = this.state.selectedDate;
                    }
                }
            }
        }
    }

    onDocumentClick(ev) {
        if (this.state.isOpen && !this.el?.contains(ev.target)) {
            this.state.isOpen = false;
        }
    }

    togglePicker() {
        if (this.props.readonly) return;
        this.state.isOpen = !this.state.isOpen;
    }

    prevMonth() {
        if (this.state.currentMonth === 1) {
            this.state.currentYear--;
            this.state.currentMonth = 12;
        } else {
            this.state.currentMonth--;
        }
    }

    nextMonth() {
        if (this.state.currentMonth === 12) {
            this.state.currentYear++;
            this.state.currentMonth = 1;
        } else {
            this.state.currentMonth++;
        }
    }

    get daysInMonth() {
        const m = this.state.currentMonth;
        if (m <= 6) return 31;
        if (m <= 11) return 30;
        return this.isLeapJalaliYear(this.state.currentYear) ? 30 : 29;
    }

    get yearOptions() {
        const years = [];
        for (let y = 1340; y <= 1460; y++) {
            years.push(y);
        }
        return years;
    }

    getTodayJalali() {
        const now = new Date();
        return this.gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    selectToday() {
        const today = this.getTodayJalali();
        if (today) {
            this.state.currentYear = today.year;
            this.state.currentMonth = today.month;
            this.selectDay(today.day);
        }
    }

    clearDate() {
        this.state.selectedDate = null;
        this.state.persianDisplay = '';
        this.state.isOpen = false;
        this.props.record.update({ [this.props.name]: false });
    }

    onMonthSelect(ev) {
        this.state.currentMonth = parseInt(ev.target.value, 10);
    }

    onYearSelect(ev) {
        this.state.currentYear = parseInt(ev.target.value, 10);
    }

    onInputChange(ev) {
        const inputVal = ev.target.value;
        if (!inputVal || !inputVal.trim()) {
            this.clearDate();
            return;
        }
        const latinStr = window.__zarvan ? window.__zarvan.toLatinDigits(inputVal.trim()) : inputVal.trim();
        let y = null, m = null, d = null;
        const m1 = latinStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        if (m1) {
            y = parseInt(m1[1], 10);
            m = parseInt(m1[2], 10);
            d = parseInt(m1[3], 10);
        } else {
            const m2 = latinStr.match(/^(\d{4})(\d{2})(\d{2})/);
            if (m2) {
                y = parseInt(m2[1], 10);
                m = parseInt(m2[2], 10);
                d = parseInt(m2[3], 10);
            }
        }

        if (y && m && d && y >= 1300 && y <= 1500 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            this.state.currentYear = y;
            this.state.currentMonth = m;
            this.selectDay(d);
        } else {
            this.state.persianDisplay = this.state.selectedDate || '';
        }
    }

    stepDay(delta) {
        if (!this.state.selectedDate) {
            this.selectToday();
            return;
        }
        const parts = this.state.selectedDate.split('/');
        let y = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let d = parseInt(parts[2], 10) + delta;

        const maxDays = this.getDaysInJalaliMonth(y, m);
        if (d > maxDays) {
            d = 1;
            m += 1;
            if (m > 12) {
                m = 1;
                y += 1;
            }
        } else if (d < 1) {
            m -= 1;
            if (m < 1) {
                m = 12;
                y -= 1;
            }
            d = this.getDaysInJalaliMonth(y, m);
        }
        this.state.currentYear = y;
        this.state.currentMonth = m;
        this.selectDay(d);
    }

    onInputKeydown(ev) {
        if (ev.key === 'Escape') {
            this.state.isOpen = false;
        } else if (ev.key === 'Enter') {
            this.onInputChange(ev);
            this.state.isOpen = false;
        } else if (ev.key.toLowerCase() === 't' && !ev.ctrlKey && !ev.metaKey) {
            ev.preventDefault();
            this.selectToday();
        } else if (ev.key === 'ArrowUp' || ev.key === '+') {
            ev.preventDefault();
            this.stepDay(1);
        } else if (ev.key === 'ArrowDown' || ev.key === '-') {
            ev.preventDefault();
            this.stepDay(-1);
        } else if (ev.key === 'PageUp') {
            ev.preventDefault();
            this.nextMonth();
        } else if (ev.key === 'PageDown') {
            ev.preventDefault();
            this.prevMonth();
        }
    }

    formatDayNumber(d) {
        if (window.__zarvan && window.__zarvan.toPersianDigits && user.jalali_use_persian_numbers) {
            return window.__zarvan.toPersianDigits(d);
        }
        return d;
    }

    get firstWeekdayOffset() {
        const gDate = this.jalaliToGregorian(this.state.currentYear, this.state.currentMonth, 1);
        if (!gDate) return 0;
        const jsDate = new Date(gDate.year, gDate.month - 1, gDate.day);
        const day = jsDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        return (day + 1) % 7; // Saturday=0 ... Friday=6
    }

    get calendarDays() {
        const days = [];
        const offset = this.firstWeekdayOffset;
        const today = this.getTodayJalali();
        for (let i = 0; i < offset; i++) {
            days.push({ empty: true });
        }
        for (let d = 1; d <= this.daysInMonth; d++) {
            const formatted = `${this.state.currentYear}/${String(this.state.currentMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
            const isToday = today && today.year === this.state.currentYear && today.month === this.state.currentMonth && today.day === d;
            const weekdayIndex = (offset + d - 1) % 7;
            days.push({
                day: d,
                displayDay: this.formatDayNumber(d),
                empty: false,
                isSelected: this.state.selectedDate === formatted,
                isToday: Boolean(isToday),
                isFriday: weekdayIndex === 6,
            });
        }
        return days;
    }

    selectDay(day) {
        const jStr = `${this.state.currentYear}/${String(this.state.currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
        this.state.selectedDate = jStr;
        this.state.persianDisplay = jStr;
        this.state.isOpen = false;

        // Convert to ISO Gregorian Date for Odoo ORM Field
        const g = this.jalaliToGregorian(this.state.currentYear, this.state.currentMonth, day);
        if (g) {
            const gStr = `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`;
            const field = this.props.record.fields ? this.props.record.fields[this.props.name] : null;
            let finalVal = gStr;
            if (field && field.type === 'datetime') {
                const currentVal = this.props.record.data[this.props.name];
                let timePart = "00:00:00";
                if (currentVal) {
                    if (typeof currentVal === 'string' && currentVal.includes(' ')) {
                        timePart = currentVal.split(' ')[1];
                    } else if (currentVal.toFormat) {
                        timePart = currentVal.toFormat('HH:mm:ss');
                    }
                }
                finalVal = `${gStr} ${timePart}`;
            }
            this.props.record.update({ [this.props.name]: finalVal });
        }
    }

    // Mathematical Jalali Conversion Routines
    isLeapJalaliYear(jy) {
        const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
        let bl = breaks.length, jp = breaks[0], jm, jump, leap, n, i;
        if (jy < jp || jy >= breaks[bl - 1]) return false;
        for (i = 1; i < bl; i += 1) {
            jm = breaks[i];
            jump = jm - jp;
            if (jy < jm) break;
            jp = jm;
        }
        n = jy - jp;
        if (jump - n < 6) n = n - jump + ((jump + 4) >> 2) * 4;
        leap = (((n + 1) % 33) - 1) % 4;
        if (leap === -1) leap = 4;
        return leap === 0;
    }

    jalaliToGregorian(jy, jm, jd) {
        if (window.__zarvan && window.__zarvan.jalaliToGregorian) {
            return window.__zarvan.jalaliToGregorian(jy, jm, jd);
        }
        let gy, gm, gd;
        const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
        let bl = breaks.length, jp = breaks[0], jm_break, jump, leap, n, i;
        let march;
        if (jy < jp || jy >= breaks[bl - 1]) return null;
        for (i = 1; i < bl; i += 1) {
            jm_break = breaks[i];
            jump = jm_break - jp;
            if (jy < jm_break) break;
            jp = jm_break;
        }
        n = jy - jp;
        if (jump - n < 6) n = n - jump + ((jump + 4) >> 2) * 4;
        leap = (((n + 1) % 33) - 1) % 4;
        if (leap === -1) leap = 4;
        gy = jy + 621;
        march = 20 + ((jump - n < 6 ? 1 : 0) + (leap === 0 ? 1 : 0));
        let days = (jm <= 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186) + jd - 1;
        let g_day_no = days + march;
        const g_days_in_month = [31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        gm = 3;
        while (g_day_no > g_days_in_month[gm - 1]) {
            g_day_no -= g_days_in_month[gm - 1];
            gm++;
            if (gm > 12) { gm = 1; gy++; }
        }
        gd = g_day_no;
        return { year: gy, month: gm, day: gd };
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

export const jalaliDatePicker = {
    component: JalaliDatePicker,
    supportedTypes: ["date", "datetime"],
};

registry.category("fields").add("jalali_date", jalaliDatePicker);
