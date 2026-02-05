import { v4 as uuidv4 } from 'uuid';
import {
  Category,
  Transaction,
  Budget,
  Settings,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../types';

const STORAGE_KEYS = {
  categories: 'dime_categories',
  transactions: 'dime_transactions',
  budgets: 'dime_budgets',
  settings: 'dime_settings',
  initialized: 'dime_initialized',
};

const DEFAULT_SETTINGS: Settings = {
  currency: 'USD',
  currencySymbol: '$',
  showDecimals: true,
  darkMode: 'system',
  firstDayOfWeek: 0,
  startDayOfMonth: 1,
  showCents: true,
};

function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function initializeStore(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (initialized) return;

  const expenseCategories: Category[] = DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
    ...c,
    id: uuidv4(),
    order: i,
  }));

  const incomeCategories: Category[] = DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
    ...c,
    id: uuidv4(),
    order: i,
  }));

  save(STORAGE_KEYS.categories, [...expenseCategories, ...incomeCategories]);
  save(STORAGE_KEYS.transactions, []);
  save(STORAGE_KEYS.budgets, []);
  save(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  localStorage.setItem(STORAGE_KEYS.initialized, 'true');
}

// Categories
export function getCategories(): Category[] {
  return load<Category[]>(STORAGE_KEYS.categories, []);
}

export function getCategoriesByType(type: 'expense' | 'income'): Category[] {
  return getCategories()
    .filter((c) => c.type === type)
    .sort((a, b) => a.order - b.order);
}

export function getCategoryById(id: string): Category | undefined {
  return getCategories().find((c) => c.id === id);
}

export function addCategory(category: Omit<Category, 'id' | 'order'>): Category {
  const categories = getCategories();
  const sameType = categories.filter((c) => c.type === category.type);
  const newCategory: Category = {
    ...category,
    id: uuidv4(),
    order: sameType.length,
  };
  save(STORAGE_KEYS.categories, [...categories, newCategory]);
  return newCategory;
}

export function updateCategory(id: string, updates: Partial<Category>): void {
  const categories = getCategories();
  save(
    STORAGE_KEYS.categories,
    categories.map((c) => (c.id === id ? { ...c, ...updates } : c))
  );
}

export function deleteCategory(id: string): void {
  const categories = getCategories();
  save(
    STORAGE_KEYS.categories,
    categories.filter((c) => c.id !== id)
  );
  // Also delete related transactions
  const transactions = getTransactions();
  save(
    STORAGE_KEYS.transactions,
    transactions.filter((t) => t.categoryId !== id)
  );
}

export function reorderCategories(type: 'expense' | 'income', orderedIds: string[]): void {
  const categories = getCategories();
  const updated = categories.map((c) => {
    if (c.type === type) {
      const newOrder = orderedIds.indexOf(c.id);
      return newOrder >= 0 ? { ...c, order: newOrder } : c;
    }
    return c;
  });
  save(STORAGE_KEYS.categories, updated);
}

// Transactions
export function getTransactions(): Transaction[] {
  return load<Transaction[]>(STORAGE_KEYS.transactions, []);
}

export function getTransactionsSorted(): Transaction[] {
  return getTransactions().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  save(STORAGE_KEYS.transactions, [...transactions, newTransaction]);
  return newTransaction;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): void {
  const transactions = getTransactions();
  save(
    STORAGE_KEYS.transactions,
    transactions.map((t) => (t.id === id ? { ...t, ...updates } : t))
  );
}

export function deleteTransaction(id: string): void {
  const transactions = getTransactions();
  save(
    STORAGE_KEYS.transactions,
    transactions.filter((t) => t.id !== id)
  );
}

// Budgets
export function getBudgets(): Budget[] {
  return load<Budget[]>(STORAGE_KEYS.budgets, []);
}

export function addBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Budget {
  const budgets = getBudgets();
  const newBudget: Budget = {
    ...budget,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  save(STORAGE_KEYS.budgets, [...budgets, newBudget]);
  return newBudget;
}

export function updateBudget(id: string, updates: Partial<Budget>): void {
  const budgets = getBudgets();
  save(
    STORAGE_KEYS.budgets,
    budgets.map((b) => (b.id === id ? { ...b, ...updates } : b))
  );
}

export function deleteBudget(id: string): void {
  const budgets = getBudgets();
  save(
    STORAGE_KEYS.budgets,
    budgets.filter((b) => b.id !== id)
  );
}

// Settings
export function getSettings(): Settings {
  return load<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function updateSettings(updates: Partial<Settings>): void {
  const settings = getSettings();
  save(STORAGE_KEYS.settings, { ...settings, ...updates });
}

// Export/Import
export function exportData(): string {
  return JSON.stringify({
    categories: getCategories(),
    transactions: getTransactions(),
    budgets: getBudgets(),
    settings: getSettings(),
  }, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.categories) save(STORAGE_KEYS.categories, data.categories);
    if (data.transactions) save(STORAGE_KEYS.transactions, data.transactions);
    if (data.budgets) save(STORAGE_KEYS.budgets, data.budgets);
    if (data.settings) save(STORAGE_KEYS.settings, data.settings);
    return true;
  } catch {
    return false;
  }
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
