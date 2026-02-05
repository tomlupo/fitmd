import { useState } from 'react';
import { Settings } from '../../types';
import { exportData, importData, clearAllData } from '../../store';
import ConfirmDialog from '../common/ConfirmDialog';
import Toast from '../common/Toast';

interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onOpenCategories: () => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
];

export default function SettingsView({ settings, onUpdateSettings, onOpenCategories }: SettingsViewProps) {
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dime-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (importData(result)) {
          showToast('Data imported successfully');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Failed to import data', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = () => {
    clearAllData();
    showToast('All data cleared');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="pb-24">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Currency */}
      <div className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Currency</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-gray-900 dark:text-white">Currency</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">{settings.currencySymbol} {settings.currency}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>
          {showCurrencyPicker && (
            <div className="border-t border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    onUpdateSettings({ currency: c.code, currencySymbol: c.symbol });
                    setShowCurrencyPicker(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    settings.currency === c.code ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="text-gray-900 dark:text-white">{c.symbol} {c.name}</span>
                  {settings.currency === c.code && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-gray-900 dark:text-white">Show Decimals</span>
              <button
                onClick={() => onUpdateSettings({ showDecimals: !settings.showDecimals })}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.showDecimals ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    settings.showDecimals ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Appearance</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3.5">
            <span className="text-gray-900 dark:text-white text-sm mb-3 block">Theme</span>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdateSettings({ darkMode: mode })}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    settings.darkMode === mode
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Calendar</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-900 dark:text-white">First Day of Week</span>
            <div className="flex gap-2">
              {[{ label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }].map((d) => (
                <button
                  key={d.value}
                  onClick={() => onUpdateSettings({ firstDayOfWeek: d.value })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.firstDayOfWeek === d.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-gray-900 dark:text-white">Start Day of Month</span>
            <select
              value={settings.startDayOfMonth}
              onChange={(e) => onUpdateSettings({ startDayOfMonth: parseInt(e.target.value) })}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm border-0 outline-none"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Categories</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={onOpenCategories}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-gray-900 dark:text-white">Manage Categories</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Data</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <span className="text-gray-900 dark:text-white">Export Data</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            onClick={handleImport}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <span className="text-gray-900 dark:text-white">Import Data</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <span className="text-red-500">Clear All Data</span>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">About</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-900 dark:text-white">Dime Web</span>
              <span className="text-gray-500 dark:text-gray-400">v1.0.0</span>
            </div>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A web replication of the Dime iOS expense tracker. Free, open-source, and privacy-focused. All data is stored locally in your browser.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Data"
        message="This will permanently delete all your transactions, categories, and budgets. This action cannot be undone."
        confirmLabel="Clear Everything"
        onConfirm={() => { setShowClearConfirm(false); handleClearData(); }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
