import { Settings } from '../types';

export function formatCurrency(amount: number, settings: Settings): string {
  const abs = Math.abs(amount);
  const formatted = settings.showDecimals ? abs.toFixed(2) : Math.round(abs).toString();
  const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = amount < 0 ? '-' : '';
  return `${sign}${settings.currencySymbol}${withCommas}`;
}

export function formatCompactCurrency(amount: number, settings: Settings): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1000000) {
    return `${sign}${settings.currencySymbol}${(abs / 1000000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${sign}${settings.currencySymbol}${(abs / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, settings);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

export function getDateLabel(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  if (isYesterday(dateStr)) return 'Yesterday';
  return formatDate(dateStr);
}

export function groupTransactionsByDate(
  transactions: { date: string }[]
): Map<string, typeof transactions> {
  const groups = new Map<string, typeof transactions>();
  transactions.forEach((t) => {
    const dateKey = new Date(t.date).toISOString().split('T')[0];
    const group = groups.get(dateKey) || [];
    group.push(t);
    groups.set(dateKey, group);
  });
  return groups;
}
