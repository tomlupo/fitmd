import { useState, useCallback, useEffect } from 'react';
import { TabType, Transaction } from './types';
import { initializeStore } from './store';
import { useCategories, useTransactions, useBudgets, useSettings } from './hooks/useStore';
import TabBar from './components/TabBar';
import LogView from './components/log/LogView';
import InsightsView from './components/insights/InsightsView';
import BudgetView from './components/budget/BudgetView';
import SettingsView from './components/settings/SettingsView';
import TransactionForm from './components/transaction/TransactionForm';
import CategoryManager from './components/category/CategoryManager';

// Initialize store on first load
initializeStore();

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const { categories, add: addCategory, update: updateCategory, remove: removeCategory, refresh: refreshCategories } = useCategories();
  const { transactions, add: addTransaction, update: updateTransaction, remove: removeTransaction, refresh: refreshTransactions } = useTransactions();
  const { budgets, add: addBudget, update: updateBudget, remove: removeBudget, refresh: refreshBudgets } = useBudgets();
  const { settings, update: updateSettings } = useSettings();

  const handleCategoryManagerClose = useCallback(() => {
    setShowCategoryManager(false);
    refreshCategories();
    refreshTransactions();
  }, [refreshCategories, refreshTransactions]);

  const handleEditTransaction = useCallback((t: Transaction) => {
    setEditTransaction(t);
    setShowTransactionForm(true);
  }, []);

  const handleTransactionFormClose = useCallback(() => {
    setShowTransactionForm(false);
    setEditTransaction(null);
  }, []);

  const handleSaveTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    addTransaction(t);
    handleTransactionFormClose();
    refreshBudgets();
  }, [addTransaction, handleTransactionFormClose, refreshBudgets]);

  const handleUpdateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    updateTransaction(id, updates);
    handleTransactionFormClose();
    refreshBudgets();
  }, [updateTransaction, handleTransactionFormClose, refreshBudgets]);

  const handleDeleteTransaction = useCallback((id: string) => {
    removeTransaction(id);
    handleTransactionFormClose();
    refreshBudgets();
  }, [removeTransaction, handleTransactionFormClose, refreshBudgets]);

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode === 'dark') {
      root.classList.add('dark');
    } else if (settings.darkMode === 'light') {
      root.classList.remove('dark');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      handler(mq);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
    }
  }, [settings.darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-lg mx-auto relative">
        {activeTab === 'log' && (
          <LogView
            transactions={transactions}
            categories={categories}
            settings={settings}
            onDeleteTransaction={removeTransaction}
            onEditTransaction={handleEditTransaction}
            onAddTransaction={() => setShowTransactionForm(true)}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsView
            transactions={transactions}
            categories={categories}
            settings={settings}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetView
            budgets={budgets}
            transactions={transactions}
            categories={categories}
            settings={settings}
            onAddBudget={addBudget}
            onUpdateBudget={updateBudget}
            onDeleteBudget={removeBudget}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenCategories={() => setShowCategoryManager(true)}
          />
        )}
      </div>

      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddTransaction={() => setShowTransactionForm(true)}
      />

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={handleTransactionFormClose}
        editTransaction={editTransaction}
        categories={categories}
        settings={settings}
        onSave={handleSaveTransaction}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={handleCategoryManagerClose}
        categories={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={removeCategory}
      />
    </div>
  );
}
