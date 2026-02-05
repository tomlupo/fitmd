import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Transaction, Category, Settings } from '../../types';
import Modal from '../common/Modal';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  categories: Category[];
  settings: Settings;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const RECURRING_OPTIONS: { value: Transaction['recurringInterval']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const NUMPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

function formatDisplayAmount(raw: string, currencySymbol: string, showDecimals: boolean): string {
  if (!raw || raw === '0') return `${currencySymbol}0${showDecimals ? '.00' : ''}`;

  const parts = raw.split('.');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  const formatted = Number(intPart || '0').toLocaleString();

  if (parts.length > 1) {
    return `${currencySymbol}${formatted}.${parts[1]}`;
  }
  return `${currencySymbol}${formatted}`;
}

function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function TransactionForm({
  isOpen,
  onClose,
  editTransaction,
  categories,
  settings,
  onSave,
  onUpdate,
  onDelete,
}: TransactionFormProps) {
  const isEditing = !!editTransaction;

  // --- State ---
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountRaw, setAmountRaw] = useState('0');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(toISODateLocal(new Date()));
  const [time, setTime] = useState(toTimeString(new Date()));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<Transaction['recurringInterval']>('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // --- Derived ---
  const filteredCategories = categories.filter((c) => c.type === type);
  const accentColor = type === 'income' ? 'income' : 'expense';
  const amountNum = parseFloat(amountRaw) || 0;

  // --- Reset / populate on open ---
  useEffect(() => {
    if (!isOpen) return;

    if (editTransaction) {
      setType(editTransaction.type);
      setAmountRaw(String(editTransaction.amount));
      setNote(editTransaction.note);
      setSelectedCategoryId(editTransaction.categoryId);
      const d = new Date(editTransaction.date);
      setDate(toISODateLocal(d));
      setTime(toTimeString(d));
      setIsRecurring(editTransaction.isRecurring);
      setRecurringInterval(editTransaction.recurringInterval ?? 'monthly');
      setShowDatePicker(false);
    } else {
      setType('expense');
      setAmountRaw('0');
      setNote('');
      setSelectedCategoryId('');
      setDate(toISODateLocal(new Date()));
      setTime(toTimeString(new Date()));
      setIsRecurring(false);
      setRecurringInterval('monthly');
      setShowDatePicker(false);
    }
  }, [isOpen, editTransaction]);

  // Auto-select first category when type changes and nothing selected
  useEffect(() => {
    if (!isOpen) return;
    const validIds = filteredCategories.map((c) => c.id);
    if (!validIds.includes(selectedCategoryId) && filteredCategories.length > 0) {
      setSelectedCategoryId(filteredCategories[0].id);
    }
  }, [type, isOpen, filteredCategories, selectedCategoryId]);

  // --- Numpad handler ---
  const handleNumpadPress = useCallback(
    (key: string) => {
      setAmountRaw((prev) => {
        if (key === 'backspace') {
          const next = prev.slice(0, -1);
          return next === '' || next === '0' ? '0' : next;
        }

        if (key === '.') {
          if (!settings.showDecimals && !settings.showCents) return prev;
          if (prev.includes('.')) return prev;
          return prev + '.';
        }

        // Limit decimal places to 2
        if (prev.includes('.')) {
          const decPart = prev.split('.')[1];
          if (decPart && decPart.length >= 2) return prev;
        }

        // Limit whole number length to 9 digits
        if (!prev.includes('.') && prev.replace(/^0/, '').length >= 9 && key !== '.') {
          return prev;
        }

        if (prev === '0' && key !== '.') return key;
        return prev + key;
      });
    },
    [settings.showDecimals, settings.showCents],
  );

  // --- Save ---
  const handleSave = () => {
    if (amountNum <= 0) return;
    if (!selectedCategoryId) return;

    const dateTime = new Date(`${date}T${time}`);
    const isoDate = dateTime.toISOString();

    if (isEditing && editTransaction) {
      onUpdate(editTransaction.id, {
        amount: amountNum,
        note,
        categoryId: selectedCategoryId,
        date: isoDate,
        type,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
    } else {
      onSave({
        amount: amountNum,
        note,
        categoryId: selectedCategoryId,
        date: isoDate,
        type,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
    }

    onClose();
  };

  // --- Delete ---
  const handleDelete = () => {
    if (editTransaction) {
      onDelete(editTransaction.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} fullScreen>
      <div className="flex flex-col h-full min-h-0">
        {/* ======= HEADER: Type Toggle ======= */}
        <div className="px-5 pt-5 pb-2">
          <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            {/* Sliding indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow transition-all duration-300 ease-in-out ${
                type === 'expense'
                  ? 'left-1 bg-expense'
                  : 'left-[calc(50%+2px)] bg-income'
              }`}
            />
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                type === 'expense'
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                type === 'income'
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* ======= AMOUNT DISPLAY ======= */}
        <div className="px-5 py-4 text-center">
          <p
            className={`text-4xl font-bold tracking-tight transition-colors duration-200 ${
              type === 'income'
                ? 'text-income'
                : 'text-expense'
            }`}
          >
            {amountNum > 0 ? (type === 'income' ? '+' : '-') : ''}
            {formatDisplayAmount(amountRaw, settings.currencySymbol, settings.showDecimals)}
          </p>
        </div>

        {/* ======= SCROLLABLE MIDDLE CONTENT ======= */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-3 space-y-4">
          {/* --- Note Input --- */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Note
            </label>
            <input
              type="text"
              maxLength={50}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            <p className="text-right text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              {note.length}/50
            </p>
          </div>

          {/* --- Category Picker --- */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Category
            </label>
            <div
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1"
            >
              {filteredCategories.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 py-3">
                  No categories for this type.
                </p>
              )}
              {filteredCategories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 min-w-[72px] ${
                      isSelected
                        ? 'bg-gray-900 dark:bg-white shadow-md scale-[1.02]'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-xl leading-none">{cat.emoji}</span>
                    <span
                      className={`text-[10px] font-medium leading-tight truncate max-w-[60px] ${
                        isSelected
                          ? 'text-white dark:text-gray-900'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- Date / Time --- */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Date & Time
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm text-gray-900 dark:text-white transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {new Date(`${date}T${time}`).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-500">
                {new Date(`${date}T${time}`).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </button>

            {showDatePicker && (
              <div className="mt-2 flex gap-2 animate-fadeIn">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-32 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>
            )}
          </div>

          {/* --- Recurring Toggle --- */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recurring
                </span>
              </div>

              {/* iOS-style toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring((v) => !v)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 ${
                  isRecurring
                    ? `bg-${accentColor}`
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={isRecurring ? { backgroundColor: type === 'income' ? '#10B981' : '#EF4444' } : undefined}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
                    isRecurring ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isRecurring && (
              <div className="flex gap-2 animate-fadeIn">
                {RECURRING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurringInterval(opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      recurringInterval === opt.value
                        ? 'text-white shadow-sm'
                        : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                    style={
                      recurringInterval === opt.value
                        ? { backgroundColor: type === 'income' ? '#10B981' : '#EF4444' }
                        : undefined
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- Action Buttons --- */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={amountNum <= 0 || !selectedCategoryId}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg ${
                type === 'income'
                  ? 'bg-income hover:brightness-110 shadow-income/30'
                  : 'bg-expense hover:brightness-110 shadow-expense/30'
              }`}
            >
              {isEditing ? 'Update Transaction' : 'Save Transaction'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3 rounded-xl text-red-500 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors active:scale-[0.98]"
              >
                Delete Transaction
              </button>
            )}
          </div>
        </div>

        {/* ======= NUMPAD ======= */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-3 gap-2">
            {NUMPAD_KEYS.flat().map((key) => {
              if (key === 'backspace') {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadPress(key)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center justify-center h-14 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 active:scale-95 transition-all duration-100"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  </button>
                );
              }

              if (key === '.') {
                const decimalsEnabled = settings.showDecimals || settings.showCents;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadPress(key)}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={!decimalsEnabled}
                    className="flex items-center justify-center h-14 rounded-xl bg-white dark:bg-gray-700 text-xl font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 active:scale-95 transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                  >
                    .
                  </button>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleNumpadPress(key)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex items-center justify-center h-14 rounded-xl bg-white dark:bg-gray-700 text-xl font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 active:scale-95 transition-all duration-100 shadow-sm"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
