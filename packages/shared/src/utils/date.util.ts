import { DateTime } from 'luxon';
import {
  ISODateOnlyString,
  ISODateString,
  TimeMinutes,
  MinutesFromMidnight,
  TimeHHMMString,
} from '../types/api.types';

export type DateInput = ISODateString | ISODateOnlyString | Date;

// Known Luxon format tokens used across the codebase — extend as needed.
// `string & {}` keeps it open while still providing autocomplete for the known values.
export type LuxonToken =
  | 'yyyy-MM-dd'
  | 'yyyy-LL-dd'
  | 'HH:mm'
  | 'MMM'
  | 'ccc'
  | 'MMMM yyyy'
  | 'dd/MM/yyyy'
  | (string & {});

export type SupportedLocale = 'ar-SA' | 'ar' | 'en' | (string & {});

export type FormatDateParams = {
  date: DateInput;
  token: LuxonToken;
  timezone?: string;
  locale?: SupportedLocale;
};

// ─── Core ──────────────────────────────────────────────────────────────────────

export function getNowAsUTC(): ISODateString {
  return DateTime.utc().toISO() as ISODateString;
}

/** Parse any DateInput into a Luxon DateTime (defaults to utc zone) */
function toDateTime(date: DateInput, zone = 'utc'): DateTime {
  return date instanceof Date
    ? DateTime.fromJSDate(date, { zone })
    : DateTime.fromISO(date, { zone });
}

/** Convert UTC ISO string → DateTime shifted to the given timezone */
export function fromUTC(utcString: ISODateString, timezone: string): DateTime {
  return DateTime.fromISO(utcString, { zone: 'utc' }).setZone(timezone);
}

// ─── Universal Formatter ───────────────────────────────────────────────────────

/** Format any date with a Luxon token. Optionally shift to a timezone and/or locale. */
export function formatDate({ date, token, timezone, locale }: FormatDateParams): string {
  const dt = toDateTime(date, timezone ?? 'utc');
  return (locale ? dt.setLocale(locale) : dt).toFormat(token);
}

// ─── Arabic Display Helpers ────────────────────────────────────────────────────

/** Arabic long date e.g. "الأحد، 21 فبراير 2026" — uses toLocaleString, not a token */
export function formatDateLongArabic(dateStr: ISODateOnlyString): string {
  const dt = DateTime.fromISO(dateStr).setLocale('ar-SA');
  if (!dt.isValid) return dateStr;
  return dt.toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/** Arabic date without weekday e.g. "21 فبراير 2026" */
export function formatDateArabicNoWeekday(dateStr: ISODateOnlyString): string {
  const dt = DateTime.fromISO(dateStr).setLocale('ar-SA');
  if (!dt.isValid) return dateStr;
  return dt.toLocaleString({ year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Date-Only String ──────────────────────────────────────────────────────────

/** YYYY-MM-DD → JS Date */
export function parseDateString(dateStr: ISODateOnlyString): Date | undefined {
  const dt = DateTime.fromISO(dateStr);
  return dt.isValid ? dt.toJSDate() : undefined;
}

/** YYYY-MM-DD → JS Date at midnight UTC (for Prisma @db.Date fields and DB writes) */
export function dateOnlyToUTC(dateStr: ISODateOnlyString): Date {
  return DateTime.fromISO(dateStr, { zone: 'utc' }).toJSDate();
}

// ─── Time (minutes) ────────────────────────────────────────────────────────────

/** "HH:mm" → minutes from midnight */
export function timeStringToMinutes(timeStr: string): TimeMinutes {
  const dt = DateTime.fromFormat(timeStr, 'HH:mm');
  return (dt.hour * 60 + dt.minute) as TimeMinutes;
}

/** minutes from midnight → "HH:mm" (24h, for <input type="time">) */
export function minutesToInputTimeString(timeMinutes: TimeMinutes): string {
  return DateTime.fromObject({
    hour: Math.floor(timeMinutes / 60),
    minute: timeMinutes % 60,
  }).toFormat('HH:mm');
}

/** minutes from midnight → Arabic 12h string e.g. "02:30 م" */
export function minutesToTimeString(timeMinutes: TimeMinutes): TimeHHMMString {
  const hours = Math.floor(timeMinutes / 60);
  const minutes = timeMinutes % 60;
  const period = hours >= 12 ? 'م' : 'ص';
  const hours12 = hours % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}` as TimeHHMMString;
}

export function startMinutesToTime(startMinutes: MinutesFromMidnight): TimeHHMMString {
  return minutesToTimeString(startMinutes as TimeMinutes);
}

// ─── Session / Timezone ────────────────────────────────────────────────────────

/** Converts a UTC datetime → { date, time } in the given timezone */
export function formatSessionDateAndTime(startedAt: Date | ISODateString, timezone: string) {
  const dt =
    startedAt instanceof Date
      ? DateTime.fromJSDate(startedAt, { zone: 'utc' }).setZone(timezone)
      : fromUTC(startedAt, timezone);
  return {
    date: dt.toFormat('yyyy-LL-dd') as ISODateOnlyString,
    time: (dt.hour * 60 + dt.minute) as TimeMinutes,
  };
}

/** 0-indexed day of week in user's timezone (0 = Sunday … 6 = Saturday, no Friday) */
export function getTodayDayOfWeek(timezone: string): number {
  const day = DateTime.now().setZone(timezone).weekday;
  return day === 7 ? 0 : day;
}

export function getStartAndEndOfDay(
  timezone: string,
  date?: ISODateOnlyString | DateTime
): {
  startAsDatetime: DateTime;
  startAsJSDate: Date;
  endAsDatetime: DateTime;
  endAsJSDate: Date;
} {
  const dt =
    typeof date === 'string'
      ? DateTime.fromISO(date, { zone: timezone })
      : (date ?? DateTime.now().setZone(timezone));
  return {
    startAsDatetime: dt.startOf('day'),
    endAsDatetime: dt.endOf('day'),
    startAsJSDate: dt.startOf('day').toUTC().toJSDate(),
    endAsJSDate: dt.endOf('day').toUTC().toJSDate(),
  };
}

/** Combine YYYY-MM-DD + minutes-from-midnight in a timezone → UTC ISODateString */
export function combineDateTime(
  dateStr: ISODateOnlyString,
  timeMinutes: TimeMinutes,
  timezone: string
): ISODateString {
  return DateTime.fromISO(dateStr, { zone: timezone })
    .set({ hour: Math.floor(timeMinutes / 60), minute: timeMinutes % 60 })
    .toUTC()
    .toISO() as ISODateString;
}

// ─── Week / Saturday Utilities ─────────────────────────────────────────────────

// Luxon: Saturday = weekday 6
export function isSaturday(dateStr: ISODateOnlyString): boolean {
  return DateTime.fromISO(dateStr, { zone: 'utc' }).weekday === 6;
}

export function addDaysToDateStr(dateStr: ISODateOnlyString, days: number): ISODateOnlyString {
  return DateTime.fromISO(dateStr, { zone: 'utc' })
    .plus({ days })
    .toFormat('yyyy-MM-dd') as ISODateOnlyString;
}

export function getNextSaturdayFrom(saturdayDateStr: ISODateOnlyString): ISODateOnlyString {
  return addDaysToDateStr(saturdayDateStr, 7);
}

export function isDateTodayOrFuture(dateStr: ISODateOnlyString): boolean {
  return DateTime.fromISO(dateStr, { zone: 'utc' }).startOf('day') >= DateTime.utc().startOf('day');
}

/** Convert a JS Date (UTC) to an ISO date-only string (YYYY-MM-DD) */
export function dateToISODateOnly(date: Date): ISODateOnlyString {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('yyyy-MM-dd') as ISODateOnlyString;
}
