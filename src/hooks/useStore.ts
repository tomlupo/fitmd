import { useState, useCallback, useEffect } from 'react';
import {
  Category, Transaction, Budget, Settings,
} from '../types';
import * as store from '../store';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(store.getCategories());

  const refresh = useCallback(() => setCategories(store.getCategories()), []);

  const add = useCallback((cat: Omit<Category, 'id' | 'order'>) => {
    const newCat = store.addCategory(cat);
    refresh();
    return newCat;
  }, [refresh]);

  const update = useCallback((id: string, updates: Partial<Category>) => {
    store.updateCategory(id, updates);
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    store.deleteCategory(id);
    refresh();
  }, [refresh]);

  const getByType = useCallback((type: 'expense' | 'income') => {
    return categories.filter(c => c.type === type).sort((a, b) => a.order - b.order);
  }, [categories]);

  const getById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  return { categories, add, update, remove, getByType, getById, refresh };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(store.getTransactionsSorted());

  const refresh = useCallback(() => setTransactions(store.getTransactionsSorted()), []);

  const add = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT = store.addTransaction(t);
    refresh();
    return newT;
  }, [refresh]);

  const update = useCallback((id: string, updates: Partial<Transaction>) => {
    store.updateTransaction(id, updates);
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    store.deleteTransaction(id);
    refresh();
  }, [refresh]);

  return { transactions, add, update, remove, refresh };
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>(store.getBudgets());

  const refresh = useCallback(() => setBudgets(store.getBudgets()), []);

  const add = useCallback((b: Omit<Budget, 'id' | 'createdAt'>) => {
    const newB = store.addBudget(b);
    refresh();
    return newB;
  }, [refresh]);

  const update = useCallback((id: string, updates: Partial<Budget>) => {
    store.updateBudget(id, updates);
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    store.deleteBudget(id);
    refresh();
  }, [refresh]);

  return { budgets, add, update, remove, refresh };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(store.getSettings());

  const update = useCallback((updates: Partial<Settings>) => {
    store.updateSettings(updates);
    setSettings(store.getSettings());
  }, []);

  useEffect(() => {
    const s = settings;
    if (s.darkMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (s.darkMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings]);

  return { settings, update };
}
