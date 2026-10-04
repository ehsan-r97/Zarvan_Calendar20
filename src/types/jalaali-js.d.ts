declare module 'jalaali-js' {
  export interface JalaaliDateObject {
    jy: number;
    jm: number;
    jd: number;
  }

  export interface GregorianDateObject {
    gy: number;
    gm: number;
    gd: number;
  }

  export function toJalaali(gy: number, gm: number, gd: number): JalaaliDateObject;
  export function toGregorian(jy: number, jm: number, jd: number): GregorianDateObject;
  export function isValidJalaaliDate(jy: number, jm: number, jd: number): boolean;
  export function isLeapJalaaliYear(jy: number): boolean;
  export function jalaaliMonthLength(jy: number, jm: number): number;
  export function jalaliToDate(jy: number, jm: number, jd: number): Date;
  export function d2g(jdn: number): GregorianDateObject;
  export function g2d(gy: number, gm: number, gd: number): number;
  export function d2j(jdn: number): JalaaliDateObject;
  export function j2d(jy: number, jm: number, jd: number): number;
}
