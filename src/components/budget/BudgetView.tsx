import { useState, useMemo } from 'react';
import type { Budget, Transaction, Category, Settings } from '../../types';
import { formatCurrency } from '../../utils/format';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  differenceInDays, format,
} from '../../utils/dateUtils';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';

interface BudgetViewProps {
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
  onAddBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  onUpdateBudget: (id: string, updates: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
}

type BudgetTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function getBudgetPeriodRange(budget: Budget): { start: Date; end: Date } {
  const now = new Date();
  switch (budget.timeframe) {
    case 'daily':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'weekly':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'yearly':
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

function getBudgetPeriodEnd(budget: Budget): Date {
  return getBudgetPeriodRange(budget).end;
}

function getBudgetSpent(budget: Budget, transactions: Transaction[]): number {
  const { start, end } = getBudgetPeriodRange(budget);

  return transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      if (d < start || d > end) return false;
      if (budget.type === 'category' && budget.categoryId) {
        return t.categoryId === budget.categoryId;
      }
      return true;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

function getDaysRemaining(budget: Budget): number {
  const end = getBudgetPeriodEnd(budget);
  const now = new Date();
  const days = differenceInDays(end, now);
  return Math.max(0, days);
}

function getTimeRemainingText(budget: Budget): string {
  const days = getDaysRemaining(budget);
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function getProgressColor(percentage: number): string {
  if (percentage > 90) return '#EF4444';
  if (percentage > 70) return '#F59E0B';
  return '#10B981';
}

function getProgressColorClass(percentage: number): string {
  if (percentage > 90) return 'text-red-500';
  if (percentage > 70) return 'text-amber-500';
  return 'text-emerald-500';
}

function getProgressBgClass(percentage: number): string {
  if (percentage > 90) return 'bg-red-50 dark:bg-red-900/20';
  if (percentage > 70) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-emerald-50 dark:bg-emerald-900/20';
}

function timeframeLabel(tf: BudgetTimeframe): string {
  switch (tf) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'yearly': return 'Yearly';
  }
}

// ---------------------------------------------------------------------------
// Progress Arc SVG
// ---------------------------------------------------------------------------

interface ProgressArcProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
}

function ProgressArc({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  subLabel,
}: ProgressArcProps) {
  const clamped = Math.min(percentage, 100);
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + 8;

  // Arc from 180 to 0 degrees (left to right, semicircle)
  const startAngle = Math.PI;
  const endAngle = 0;

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);

  const backgroundPath = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;

  // Progress arc length
  const totalLength = Math.PI * radius;
  const filledLength = (clamped / 100) * totalLength;
  const color = getProgressColor(percentage);

  return (
    <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
      {/* Background arc */}
      <path
        d={backgroundPath}
        fill="none"
        stroke="currentColor"
        className="text-gray-200 dark:text-gray-700"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <path
        d={backgroundPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${filledLength} ${totalLength}`}
        className="transition-all duration-700 ease-out"
      />
      {/* Center text */}
      {label && (
        <text
          x={cx}
          y={cy - radius * 0.25}
          textAnchor="middle"
          className="fill-gray-900 dark:fill-white font-bold"
          style={{ fontSize: size * 0.18 }}
        >
          {label}
        </text>
      )}
      {subLabel && (
        <text
          x={cx}
          y={cy - radius * 0.25 + size * 0.14}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          style={{ fontSize: size * 0.1 }}
        >
          {subLabel}
        </text>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Budget Card
// ---------------------------------------------------------------------------

interface BudgetCardData {
  budget: Budget;
  spent: number;
  category?: Category;
}

interface BudgetCardProps extends BudgetCardData {
  settings: Settings;
  onClick: () => void;
  isOverall?: boolean;
}

function BudgetCard({ budget, spent, category, settings, onClick, isOverall }: BudgetCardProps) {
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = Math.max(0, budget.amount - spent);
  const colorClass = getProgressColorClass(percentage);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 hover:shadow-md transition-shadow active:scale-[0.98] ${
        isOverall ? '' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Progress arc */}
        <div className="flex-shrink-0">
          <ProgressArc
            percentage={percentage}
            size={isOverall ? 120 : 96}
            strokeWidth={isOverall ? 10 : 8}
            label={`${Math.round(percentage)}%`}
            subLabel="spent"
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className="text-lg">{category.emoji}</span>
            )}
            {isOverall && (
              <span className="text-lg">💰</span>
            )}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {isOverall ? 'Overall Budget' : category?.name ?? 'Budget'}
            </h3>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {timeframeLabel(budget.timeframe)} &middot; {getTimeRemainingText(budget)}
          </p>

          <div className="flex items-baseline gap-1 mb-1">
            <span className={`text-base font-bold ${colorClass}`}>
              {formatCurrency(spent, settings)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              / {formatCurrency(budget.amount, settings)}
            </span>
          </div>

          {/* Remaining */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {remaining > 0
              ? `${formatCurrency(remaining, settings)} remaining`
              : 'Over budget'}
          </p>

          {/* Mini progress bar */}
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getProgressColor(percentage),
              }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Budget Detail View
// ---------------------------------------------------------------------------

interface BudgetDetailProps {
  budget: Budget;
  spent: number;
  category?: Category;
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BudgetDetail({
  budget,
  spent,
  category,
  transactions: allTransactions,
  categories,
  settings,
  onClose,
  onEdit,
  onDelete,
}: BudgetDetailProps) {
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = Math.max(0, budget.amount - spent);
  const colorClass = getProgressColorClass(percentage);
  const bgClass = getProgressBgClass(percentage);
  const { start, end } = getBudgetPeriodRange(budget);
  const daysInPeriod = differenceInDays(end, start) + 1;
  const perDayAvg = daysInPeriod > 0 ? spent / Math.max(1, differenceInDays(new Date(), start) + 1) : 0;
  const dailyBudget = daysInPeriod > 0 ? budget.amount / daysInPeriod : 0;

  // Filter transactions for this budget's period
  const periodTransactions = useMemo(() => {
    return allTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        if (d < start || d > end) return false;
        if (budget.type === 'category' && budget.categoryId) {
          return t.categoryId === budget.categoryId;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, budget, start, end]);

  // Category breakdown (for overall budgets)
  const categoryBreakdown = useMemo(() => {
    if (budget.type !== 'overall') return [];
    const map = new Map<string, number>();
    periodTransactions.forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([catId, amount]) => ({
        category: categories.find((c) => c.id === catId),
        amount,
        percentage: budget.amount > 0 ? (amount / budget.amount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, categories, budget]);

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm font-medium text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">
            {budget.type === 'overall' ? '💰' : category?.emoji ?? '📦'}
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {budget.type === 'overall' ? 'Overall Budget' : category?.name ?? 'Budget'}
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {timeframeLabel(budget.timeframe)} &middot; {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Large Progress Arc */}
      <div className="flex justify-center mb-6">
        <ProgressArc
          percentage={percentage}
          size={200}
          strokeWidth={14}
          label={`${Math.round(percentage)}%`}
          subLabel="spent"
        />
      </div>

      {/* Amount summary */}
      <div className={`rounded-2xl p-4 mb-6 ${bgClass}`}>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spent</p>
            <p className={`text-lg font-bold ${colorClass}`}>
              {formatCurrency(spent, settings)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(budget.amount, settings)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
            <p className={`text-lg font-bold ${remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {remaining > 0
                ? formatCurrency(remaining, settings)
                : `-${formatCurrency(spent - budget.amount, settings)}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{getTimeRemainingText(budget)}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {getDaysRemaining(budget)}
              <span className="text-xs font-normal text-gray-400 ml-1">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Per-day average */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily average</p>
            <p className={`text-base font-bold ${perDayAvg > dailyBudget ? 'text-red-500' : 'text-emerald-500'}`}>
              {formatCurrency(perDayAvg, settings)}
              <span className="text-xs font-normal text-gray-400 ml-1">/ day</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily target</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {formatCurrency(dailyBudget, settings)}
              <span className="text-xs font-normal text-gray-400 ml-1">/ day</span>
            </p>
          </div>
        </div>
      </div>

      {/* Category breakdown (overall budgets only) */}
      {budget.type === 'overall' && categoryBreakdown.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Spending Breakdown
          </h3>
          <div className="space-y-2">
            {categoryBreakdown.map(({ category: cat, amount, percentage: pct }) => (
              <div
                key={cat?.id ?? 'unknown'}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl p-3"
              >
                <span className="text-lg">{cat?.emoji ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {cat?.name ?? 'Unknown'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">
                      {formatCurrency(amount, settings)}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: cat?.color ?? '#9CA3AF',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Transactions ({periodTransactions.length})
        </h3>
        {periodTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            No transactions in this period
          </p>
        ) : (
          <div className="space-y-1">
            {periodTransactions.slice(0, 20).map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700/30 last:border-0"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{ backgroundColor: cat ? `${cat.color}18` : '#F3F4F6' }}
                  >
                    {cat?.emoji ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {t.note || cat?.name || 'Expense'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {format(new Date(t.date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    -{formatCurrency(t.amount, settings)}
                  </span>
                </div>
              );
            })}
            {periodTransactions.length > 20 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2">
                +{periodTransactions.length - 20} more transactions
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Budget Creation / Edit Form
// ---------------------------------------------------------------------------

interface BudgetFormProps {
  budget?: Budget;
  categories: Category[];
  settings: Settings;
  existingBudgets: Budget[];
  onSave: (data: Omit<Budget, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function BudgetForm({ budget, categories, settings, existingBudgets, onSave, onCancel }: BudgetFormProps) {
  const [budgetType, setBudgetType] = useState<'overall' | 'category'>(budget?.type ?? 'overall');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(budget?.categoryId ?? '');
  const [timeframe, setTimeframe] = useState<BudgetTimeframe>(budget?.timeframe ?? 'monthly');
  const [amountStr, setAmountStr] = useState(budget ? String(budget.amount) : '');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Categories that already have budgets with the same timeframe
  const usedCategoryIds = existingBudgets
    .filter((b) => b.type === 'category' && b.id !== budget?.id)
    .map((b) => b.categoryId);

  const hasOverallBudget = existingBudgets.some(
    (b) => b.type === 'overall' && b.id !== budget?.id
  );

  const canSave = (() => {
    if (!amountStr || Number(amountStr) <= 0) return false;
    if (budgetType === 'category' && !selectedCategoryId) return false;
    return true;
  })();

  const handleNumpad = (key: string) => {
    if (key === 'backspace') {
      setAmountStr((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr((prev) => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      // Limit decimal places
      if (amountStr.includes('.')) {
        const decimals = amountStr.split('.')[1];
        if (decimals && decimals.length >= 2) return;
      }
      setAmountStr((prev) => {
        if (prev === '0' && key !== '.') return key;
        return prev + key;
      });
    }
  };

  const handleSave = () => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    onSave({
      amount,
      type: budgetType,
      categoryId: budgetType === 'category' ? selectedCategoryId : undefined,
      timeframe,
      startDay: 1,
    });
  };

  return (
    <div className="p-5">
      {/* Budget Type Selector */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
          Budget Type
        </label>
        <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
          <button
            onClick={() => setBudgetType('overall')}
            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
              budgetType === 'overall'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            disabled={hasOverallBudget && budgetType !== 'overall' && !budget}
          >
            Overall
          </button>
          <button
            onClick={() => setBudgetType('category')}
            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
              budgetType === 'category'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Category
          </button>
        </div>
        {hasOverallBudget && budgetType !== 'overall' && !budget && (
          <p className="text-xs text-amber-500 mt-1.5">
            An overall budget already exists
          </p>
        )}
      </div>

      {/* Category Picker (for category budgets) */}
      {budgetType === 'category' && (
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            Category
          </label>
          <div className="grid grid-cols-4 gap-2">
            {expenseCategories.map((cat) => {
              const alreadyUsed = usedCategoryIds.includes(cat.id);
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => !alreadyUsed && setSelectedCategoryId(cat.id)}
                  disabled={alreadyUsed}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : alreadyUsed
                        ? 'border-transparent bg-gray-50 dark:bg-gray-700/30 opacity-40 cursor-not-allowed'
                        : 'border-transparent bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate w-full text-center">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
          Timeframe
        </label>
        <div className="grid grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
          {(['daily', 'weekly', 'monthly', 'yearly'] as BudgetTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                timeframe === tf
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {timeframeLabel(tf)}
            </button>
          ))}
        </div>
      </div>

      {/* Amount display */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
          Amount
        </label>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl py-6 px-4 text-center">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {settings.currencySymbol}
            {amountStr || '0'}
          </span>
        </div>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
          <button
            key={key}
            onClick={() => handleNumpad(key)}
            className="h-14 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-lg font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors flex items-center justify-center"
          >
            {key === 'backspace' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            canSave
              ? 'bg-primary text-white hover:bg-primary-dark active:scale-[0.98]'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {budget ? 'Update Budget' : 'Create Budget'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main BudgetView Component
// ---------------------------------------------------------------------------

export default function BudgetView({
  budgets,
  transactions,
  categories,
  settings,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
}: BudgetViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  // Build card data
  const budgetCards: BudgetCardData[] = useMemo(() => {
    return budgets.map((b) => ({
      budget: b,
      spent: getBudgetSpent(b, transactions),
      category: b.categoryId ? categories.find((c) => c.id === b.categoryId) : undefined,
    }));
  }, [budgets, transactions, categories]);

  const overallCards = budgetCards.filter((bc) => bc.budget.type === 'overall');
  const categoryCards = budgetCards.filter((bc) => bc.budget.type === 'category');

  // Handlers
  const handleAddBudget = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(null);
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleSaveBudget = (data: Omit<Budget, 'id' | 'createdAt'>) => {
    if (editingBudget) {
      onUpdateBudget(editingBudget.id, data);
    } else {
      onAddBudget(data);
    }
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteBudget(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedBudget(null);
    }
  };

  const handleRequestDelete = (budget: Budget) => {
    setDeleteTarget(budget);
  };

  // If a budget is selected, show detail view
  if (selectedBudget) {
    const card = budgetCards.find((bc) => bc.budget.id === selectedBudget.id);
    if (card) {
      return (
        <div className="max-w-lg mx-auto">
          <BudgetDetail
            budget={card.budget}
            spent={card.spent}
            category={card.category}
            transactions={transactions}
            categories={categories}
            settings={settings}
            onClose={() => setSelectedBudget(null)}
            onEdit={() => handleEditBudget(card.budget)}
            onDelete={() => handleRequestDelete(card.budget)}
          />

          <ConfirmDialog
            isOpen={deleteTarget !== null}
            title="Delete Budget"
            message="Are you sure you want to delete this budget? This action cannot be undone."
            confirmLabel="Delete"
            destructive
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
        <button
          onClick={handleAddBudget}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:bg-primary-dark active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Empty state */}
      {budgets.length === 0 && (
        <EmptyState
          emoji="📊"
          title="No Budgets Yet"
          subtitle="Create a budget to track your spending and stay on target."
          action={{ label: 'Add Budget', onClick: handleAddBudget }}
        />
      )}

      {/* Budget list */}
      {budgets.length > 0 && (
        <div className="px-5 space-y-4 mt-2">
          {/* Overall budgets */}
          {overallCards.map((card) => (
            <BudgetCard
              key={card.budget.id}
              {...card}
              settings={settings}
              onClick={() => setSelectedBudget(card.budget)}
              isOverall
            />
          ))}

          {/* Category budgets section */}
          {categoryCards.length > 0 && (
            <>
              {overallCards.length > 0 && (
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pt-2">
                  Category Budgets
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryCards.map((card) => (
                  <BudgetCard
                    key={card.budget.id}
                    {...card}
                    settings={settings}
                    onClick={() => setSelectedBudget(card.budget)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Budget FAB (visible when budgets exist) */}
      {budgets.length > 0 && (
        <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:ml-[200px]">
          <button
            onClick={handleAddBudget}
            className="w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-dark active:scale-95 transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {/* Budget Creation / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? 'Edit Budget' : 'New Budget'}
      >
        <BudgetForm
          budget={editingBudget ?? undefined}
          categories={categories}
          settings={settings}
          existingBudgets={budgets}
          onSave={handleSaveBudget}
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
