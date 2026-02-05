import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  subDays, subWeeks, subMonths, subYears,
  addDays, addWeeks, addMonths, addYears,
  format, isSameDay, differenceInDays,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
} from 'date-fns';
import { TimeFrame } from '../types';

export function getDateRange(
  timeframe: TimeFrame,
  referenceDate: Date = new Date(),
  firstDayOfWeek: 0 | 1 = 0
): { start: Date; end: Date } {
  const weekOptions = { weekStartsOn: firstDayOfWeek as 0 | 1 };

  switch (timeframe) {
    case 'day':
      return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
    case 'week':
      return {
        start: startOfWeek(referenceDate, weekOptions),
        end: endOfWeek(referenceDate, weekOptions),
      };
    case 'month':
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case 'year':
      return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
    case 'all':
      return { start: new Date(2000, 0, 1), end: endOfDay(new Date()) };
  }
}

export function navigateDate(
  date: Date,
  timeframe: TimeFrame,
  direction: 'prev' | 'next'
): Date {
  const mult = direction === 'prev' ? -1 : 1;
  switch (timeframe) {
    case 'day':
      return mult > 0 ? addDays(date, 1) : subDays(date, 1);
    case 'week':
      return mult > 0 ? addWeeks(date, 1) : subWeeks(date, 1);
    case 'month':
      return mult > 0 ? addMonths(date, 1) : subMonths(date, 1);
    case 'year':
      return mult > 0 ? addYears(date, 1) : subYears(date, 1);
    case 'all':
      return date;
  }
}

export function formatDateRange(
  timeframe: TimeFrame,
  referenceDate: Date
): string {
  switch (timeframe) {
    case 'day':
      if (isSameDay(referenceDate, new Date())) return 'Today';
      if (isSameDay(referenceDate, subDays(new Date(), 1))) return 'Yesterday';
      return format(referenceDate, 'MMM d, yyyy');
    case 'week': {
      const start = startOfWeek(referenceDate);
      const end = endOfWeek(referenceDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    case 'month':
      return format(referenceDate, 'MMMM yyyy');
    case 'year':
      return format(referenceDate, 'yyyy');
    case 'all':
      return 'All Time';
  }
}

export function getBarLabels(
  timeframe: TimeFrame,
  referenceDate: Date
): { label: string; date: Date }[] {
  const { start, end } = getDateRange(timeframe, referenceDate);

  switch (timeframe) {
    case 'week': {
      const days = eachDayOfInterval({ start, end });
      return days.map((d) => ({
        label: format(d, 'EEE'),
        date: d,
      }));
    }
    case 'month': {
      const days = eachDayOfInterval({ start, end });
      return days.map((d) => ({
        label: format(d, 'd'),
        date: d,
      }));
    }
    case 'year': {
      const months = eachMonthOfInterval({ start, end });
      return months.map((d) => ({
        label: format(d, 'MMM'),
        date: d,
      }));
    }
    default:
      return [];
  }
}

export function getDaysInRange(start: Date, end: Date): number {
  return differenceInDays(end, start) + 1;
}

export { format, isSameDay, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays, subDays };
