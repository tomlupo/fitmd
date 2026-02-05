export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'expense' | 'income';
  order: number;
}

export interface Transaction {
  id: string;
  amount: number;
  note: string;
  categoryId: string;
  date: string; // ISO date string
  type: 'expense' | 'income';
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  type: 'overall' | 'category';
  categoryId?: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDay: number; // day of week (0-6) or day of month (1-31)
  createdAt: string;
}

export interface Settings {
  currency: string;
  currencySymbol: string;
  showDecimals: boolean;
  darkMode: 'light' | 'dark' | 'system';
  firstDayOfWeek: number; // 0=Sun, 1=Mon
  startDayOfMonth: number;
  showCents: boolean;
}

export type TabType = 'log' | 'insights' | 'budget' | 'settings';

export type TimeFrame = 'day' | 'week' | 'month' | 'year' | 'all';

export type FilterType = 'all' | 'income' | 'expense';

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'order'>[] = [
  { name: 'Food', emoji: '🍔', color: '#F97316', type: 'expense' },
  { name: 'Transport', emoji: '🚆', color: '#3B82F6', type: 'expense' },
  { name: 'Rent', emoji: '🏠', color: '#8B5CF6', type: 'expense' },
  { name: 'Subscriptions', emoji: '🔄', color: '#EC4899', type: 'expense' },
  { name: 'Groceries', emoji: '🛒', color: '#10B981', type: 'expense' },
  { name: 'Family', emoji: '👨‍👩‍👦', color: '#F59E0B', type: 'expense' },
  { name: 'Utilities', emoji: '💡', color: '#6366F1', type: 'expense' },
  { name: 'Fashion', emoji: '👔', color: '#14B8A6', type: 'expense' },
  { name: 'Healthcare', emoji: '🚑', color: '#EF4444', type: 'expense' },
  { name: 'Pets', emoji: '🐕', color: '#A855F7', type: 'expense' },
  { name: 'Sneakers', emoji: '👟', color: '#F472B6', type: 'expense' },
  { name: 'Gifts', emoji: '🎁', color: '#06B6D4', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'order'>[] = [
  { name: 'Paycheck', emoji: '💰', color: '#10B981', type: 'income' },
  { name: 'Allowance', emoji: '🤑', color: '#10B981', type: 'income' },
  { name: 'Part-Time', emoji: '💼', color: '#10B981', type: 'income' },
  { name: 'Investments', emoji: '💹', color: '#10B981', type: 'income' },
  { name: 'Gifts', emoji: '🧧', color: '#10B981', type: 'income' },
  { name: 'Tips', emoji: '🪙', color: '#10B981', type: 'income' },
];

export const CATEGORY_COLORS = [
  '#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#6366F1', '#14B8A6', '#EF4444', '#A855F7',
  '#F472B6', '#06B6D4', '#84CC16', '#D946EF', '#0EA5E9',
  '#E11D48', '#7C3AED', '#059669', '#DC2626', '#2563EB',
];
