/** @odoo-module **/

/**
 * Enterprise Jalali Spreadsheet Functions & Formulas for Odoo 20
 * Supports Odoo Documents Spreadsheet & o-spreadsheet:
 *
 * Custom Persian Spreadsheet Formulas:
 *  - =JDATE(year, month, day)    -> Returns Excel serial date from Jalali Y, M, D
 *  - =JYEAR(date)                -> Returns Jalali year (e.g. 1405)
 *  - =JMONTH(date)               -> Returns Jalali month (1 to 12)
 *  - =JDAY(date)                 -> Returns Jalali day (1 to 31)
 *  - =JMONTHNAME(date)           -> Returns Persian month name (e.g. "فروردین")
 *  - =JEDATE(date, months)       -> Adds N months according to Persian solar calendar rules
 *  - =JEOMONTH(date, months)     -> Returns the last day of the Shamsi month
 *  - =JFORMAT(date)              -> Returns formatted Shamsi date string
 *
 * Also supports native date math:
 *  - Adding days: =A1 + 7 or =A1 + 30 advances the calendar accurately,
 *    and cell formatting displays the result in Shamsi.
 */

// Defensive check: If o-spreadsheet is installed in this Odoo instance, register functions
try {
    let functionRegistry = null;
    let helpers = null;

    // Check Odoo 18/19/20 ES Module loader first
    if (typeof odoo !== "undefined" && odoo.loader && odoo.loader.modules) {
        const mod = odoo.loader.modules.get("@odoo/o-spreadsheet") || odoo.loader.modules.get("@spreadsheet/o_spreadsheet/o_spreadsheet");
        if (mod) {
            functionRegistry = mod.functionRegistry || (mod.default && mod.default.functionRegistry);
            helpers = mod.helpers || (mod.default && mod.default.helpers);
        }
    }

    // Fallback to window global if present
    if (!functionRegistry && window.o_spreadsheet) {
        functionRegistry = window.o_spreadsheet.functionRegistry;
        helpers = window.o_spreadsheet.helpers;
    }

    if (functionRegistry) {
        const { toBoolean, toNumber, toString } = helpers || {};

        // Helper to convert JS Date / Excel serial to Gregorian Y, M, D
        const serialToGregorian = (serial) => {
            const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
            return {
                gy: date.getUTCFullYear(),
                gm: date.getUTCMonth() + 1,
                gd: date.getUTCDate(),
            };
        };

        const gregorianToSerial = (gy, gm, gd) => {
            const date = Date.UTC(gy, gm - 1, gd);
            return Math.floor(date / (86400 * 1000)) + 25569;
        };

        // Algorithmic Jalali conversion helpers (reusing high-speed O(1) bitwise cache)
        const g2j = (gy, gm, gd) => {
            if (window.__zarvan && window.__zarvan.gregorianToJalali) {
                const res = window.__zarvan.gregorianToJalali(gy, gm, gd);
                return { jy: res.year, jm: res.month, jd: res.day };
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
            return { jy, jm, jd };
        };

        const j2g = (jy, jm, jd) => {
            if (window.__zarvan && window.__zarvan.jalaliToGregorian) {
                const res = window.__zarvan.jalaliToGregorian(jy, jm, jd);
                return res ? { gy: res.year, gm: res.month, gd: res.day } : null;
            }
            const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
            let bl = breaks.length, jp = breaks[0], jm_break, jump, leap, n, i, march;
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
            const gy = jy + 621;
            march = 20 + ((jump - n < 6 ? 1 : 0) + (leap === 0 ? 1 : 0));
            const days = (jm <= 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186) + jd - 1;
            let g_day_no = days + march;
            const g_days_in_month = [31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let gm = 3;
            while (g_day_no > g_days_in_month[gm - 1]) {
                g_day_no -= g_days_in_month[gm - 1];
                gm++;
                if (gm > 12) { gm = 1; break; }
            }
            return { gy, gm, gd: g_day_no };
        };

        const PERSIAN_MONTH_NAMES = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];

        // 1. =JDATE(jy, jm, jd)
        functionRegistry.add("JDATE", {
            description: "Creates a serial date from Persian year, month, and day.",
            args: [
                { name: "year", description: "Jalali year (e.g. 1405)" },
                { name: "month", description: "Jalali month (1 to 12)" },
                { name: "day", description: "Jalali day (1 to 31)" },
            ],
            compute: function (y, m, d) {
                const jy = Math.floor(Number(y));
                const jm = Math.floor(Number(m));
                const jd = Math.floor(Number(d));
                const g = j2g(jy, jm, jd);
                if (!g) return 0;
                return gregorianToSerial(g.gy, g.gm, g.gd);
            },
            returns: ["NUMBER"],
        });

        // 2. =JYEAR(date)
        functionRegistry.add("JYEAR", {
            description: "Returns the Shamsi/Jalali year of a date.",
            args: [{ name: "date", description: "The date serial number" }],
            compute: function (serial) {
                const g = serialToGregorian(Number(serial));
                const j = g2j(g.gy, g.gm, g.gd);
                return j.jy;
            },
            returns: ["NUMBER"],
        });

        // 3. =JMONTH(date)
        functionRegistry.add("JMONTH", {
            description: "Returns the Shamsi/Jalali month (1 to 12) of a date.",
            args: [{ name: "date", description: "The date serial number" }],
            compute: function (serial) {
                const g = serialToGregorian(Number(serial));
                const j = g2j(g.gy, g.gm, g.gd);
                return j.jm;
            },
            returns: ["NUMBER"],
        });

        // 4. =JDAY(date)
        functionRegistry.add("JDAY", {
            description: "Returns the Shamsi/Jalali day of month (1 to 31) of a date.",
            args: [{ name: "date", description: "The date serial number" }],
            compute: function (serial) {
                const g = serialToGregorian(Number(serial));
                const j = g2j(g.gy, g.gm, g.gd);
                return j.jd;
            },
            returns: ["NUMBER"],
        });

        // 5. =JMONTHNAME(date)
        functionRegistry.add("JMONTHNAME", {
            description: "Returns the Persian month name (e.g. فروردین, اردیبهشت).",
            args: [{ name: "date", description: "The date serial number" }],
            compute: function (serial) {
                const g = serialToGregorian(Number(serial));
                const j = g2j(g.gy, g.gm, g.gd);
                return PERSIAN_MONTH_NAMES[j.jm - 1] || "";
            },
            returns: ["STRING"],
        });

        const isLeapJalali = (jy) => {
            return [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33);
        };

        // 6. =JEDATE(date, months) - Adds N Persian months
        functionRegistry.add("JEDATE", {
            description: "Returns the serial date that is the indicated number of Shamsi months before or after a date.",
            args: [
                { name: "start_date", description: "The starting date serial" },
                { name: "months", description: "Number of months to add" },
            ],
            compute: function (serial, monthsToAdd) {
                const g = serialToGregorian(Number(serial));
                let { jy, jm, jd } = g2j(g.gy, g.gm, g.gd);

                const totalMonths = jy * 12 + (jm - 1) + Math.floor(Number(monthsToAdd));
                const targetJy = Math.floor(totalMonths / 12);
                const targetJm = (totalMonths % 12) + 1;

                // Adjust for month length: 31 days in months 1-6, 30 in 7-11, 29/30 in 12 (leap-aware)
                const maxDays = targetJm <= 6 ? 31 : targetJm <= 11 ? 30 : (isLeapJalali(targetJy) ? 30 : 29);
                const targetJd = Math.min(jd, maxDays);

                const newG = j2g(targetJy, targetJm, targetJd);
                if (!newG) return Number(serial);
                return gregorianToSerial(newG.gy, newG.gm, newG.gd);
            },
            returns: ["NUMBER"],
        });

        // 7. =JEOMONTH(date, months) - Returns end of Shamsi month
        functionRegistry.add("JEOMONTH", {
            description: "Returns the serial date of the last day of the Shamsi month that is the indicated number of months before or after start_date.",
            args: [
                { name: "start_date", description: "The starting date serial" },
                { name: "months", description: "Number of months to add" },
            ],
            compute: function (serial, monthsToAdd) {
                const g = serialToGregorian(Number(serial));
                let { jy, jm } = g2j(g.gy, g.gm, g.gd);

                const totalMonths = jy * 12 + (jm - 1) + Math.floor(Number(monthsToAdd));
                const targetJy = Math.floor(totalMonths / 12);
                const targetJm = (totalMonths % 12) + 1;

                const maxDays = targetJm <= 6 ? 31 : targetJm <= 11 ? 30 : (isLeapJalali(targetJy) ? 30 : 29);
                const newG = j2g(targetJy, targetJm, maxDays);
                if (!newG) return Number(serial);
                return gregorianToSerial(newG.gy, newG.gm, newG.gd);
            },
            returns: ["NUMBER"],
        });

        // 8. =JFORMAT(date)
        functionRegistry.add("JFORMAT", {
            description: "Formats a serial date into a standard Shamsi string (YYYY/MM/DD).",
            args: [{ name: "date", description: "The date serial number" }],
            compute: function (serial) {
                const g = serialToGregorian(Number(serial));
                const j = g2j(g.gy, g.gm, g.gd);
                return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
            },
            returns: ["STRING"],
        });
    }
} catch (e) {
    // Non-blocking if spreadsheet is not loaded
    console.debug("[Zarvan Calendar] o-spreadsheet functions registration skipped (spreadsheet not loaded)");
}
