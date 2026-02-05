import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Transaction, Category, Settings, TimeFrame, FilterType } from '../../types';
import { formatCurrency, getDateLabel, groupTransactionsByDate } from '../../utils/format';
import { getDateRange, navigateDate, formatDateRange } from '../../utils/dateUtils';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';

interface LogViewProps {
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onAddTransaction: () => void;
}

type SummaryMode = 'net' | 'income' | 'expense';

const TIMEFRAME_LABELS: { key: TimeFrame; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

export default function LogView({
  transactions,
  categories,
  settings,
  onDeleteTransaction,
  onEditTransaction,
  onAddTransaction,
}: LogViewProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('net');
  const [showSummaryMenu, setShowSummaryMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const summaryMenuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  // Close summary menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (summaryMenuRef.current && !summaryMenuRef.current.contains(e.target as Node)) {
        setShowSummaryMenu(false);
      }
    }
    if (showSummaryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSummaryMenu]);

  // Auto-focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Build category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Filter transactions by date range
  const dateFilteredTransactions = useMemo(() => {
    const { start, end } = getDateRange(
      timeframe,
      referenceDate,
      settings.firstDayOfWeek as 0 | 1
    );
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [transactions, timeframe, referenceDate, settings.firstDayOfWeek]);

  // Apply type filter (all / income / expense)
  const typeFilteredTransactions = useMemo(() => {
    if (filterType === 'all') return dateFilteredTransactions;
    return dateFilteredTransactions.filter((t) => t.type === filterType);
  }, [dateFilteredTransactions, filterType]);

  // Apply search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return typeFilteredTransactions;
    const q = searchQuery.toLowerCase().trim();
    return typeFilteredTransactions.filter((t) => {
      const cat = categoryMap.get(t.categoryId);
      const catName = cat?.name.toLowerCase() || '';
      const note = t.note.toLowerCase();
      const amountStr = t.amount.toString();
      return catName.includes(q) || note.includes(q) || amountStr.includes(q);
    });
  }, [typeFilteredTransactions, searchQuery, categoryMap]);

  // Sort transactions newest first, then group by date
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(sortedTransactions);
  }, [sortedTransactions]);

  // Summary calculations
  const totalIncome = useMemo(
    () => dateFilteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [dateFilteredTransactions]
  );
  const totalExpenses = useMemo(
    () => dateFilteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [dateFilteredTransactions]
  );
  const netAmount = totalIncome - totalExpenses;

  const summaryValue = summaryMode === 'net' ? netAmount : summaryMode === 'income' ? totalIncome : totalExpenses;
  const summaryLabel = summaryMode === 'net' ? 'Net' : summaryMode === 'income' ? 'Income' : 'Expenses';

  // Navigation
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (timeframe === 'all') return;
      setReferenceDate((prev) => navigateDate(prev, timeframe, direction));
    },
    [timeframe]
  );

  const handleTimeframeChange = useCallback((tf: TimeFrame) => {
    setTimeframe(tf);
    setReferenceDate(new Date());
  }, []);

  // Swipe handling
  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setSwipingId(id);
    setSwipeOffset(0);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swipingId) return;
      touchCurrentX.current = e.touches[0].clientX;
      const diff = touchStartX.current - touchCurrentX.current;
      // Only allow left swipe (positive diff), clamp to max 100px
      const offset = Math.max(0, Math.min(diff, 100));
      setSwipeOffset(offset);
    },
    [swipingId]
  );

  const handleTouchEnd = useCallback(() => {
    if (swipeOffset > 60) {
      // Threshold met -- show delete action
      setSwipeOffset(80);
    } else {
      setSwipeOffset(0);
      setSwipingId(null);
    }
  }, [swipeOffset]);

  const handleDeleteSwipedItem = useCallback(() => {
    if (swipingId) {
      setDeleteTargetId(swipingId);
    }
  }, [swipingId]);

  const confirmDelete = useCallback(() => {
    if (deleteTargetId) {
      onDeleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
      setSwipingId(null);
      setSwipeOffset(0);
    }
  }, [deleteTargetId, onDeleteTransaction]);

  const cancelDelete = useCallback(() => {
    setDeleteTargetId(null);
    setSwipingId(null);
    setSwipeOffset(0);
  }, []);

  // Close search
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Handle escape key in search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  const dateRangeLabel = formatDateRange(timeframe, referenceDate);

  const isAllTime = timeframe === 'all';

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* ---- Top Bar ---- */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log</h1>
          <div className="flex items-center gap-2">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Search transactions"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            {/* Filter Icon */}
            <div className="relative">
              <button
                onClick={() => {
                  const next: FilterType =
                    filterType === 'all' ? 'income' : filterType === 'income' ? 'expense' : 'all';
                  setFilterType(next);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  filterType !== 'all'
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-label="Filter transactions"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
              {filterType !== 'all' && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-gray-900" />
              )}
            </div>
          </div>
        </div>

        {/* Filter Badge */}
        {filterType !== 'all' && (
          <div className="px-5 pb-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              filterType === 'income'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {filterType === 'income' ? 'Income Only' : 'Expenses Only'}
              <button
                onClick={() => setFilterType('all')}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label="Clear filter"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ---- Scrollable Content ---- */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* ---- Summary Card ---- */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 p-5 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30">
            {/* Summary Mode Selector */}
            <div className="relative inline-block" ref={summaryMenuRef}>
              <button
                onClick={() => setShowSummaryMenu(!showSummaryMenu)}
                className="flex items-center gap-1.5 text-white/80 text-sm font-medium hover:text-white transition-colors"
              >
                {summaryLabel}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${showSummaryMenu ? 'rotate-180' : ''}`}
                >
                  <polyline points="2 4 6 8 10 4" />
                </svg>
              </button>
              {showSummaryMenu && (
                <div className="absolute top-full left-0 mt-1.5 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-10 animate-scaleIn origin-top-left">
                  {(['net', 'income', 'expense'] as SummaryMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSummaryMode(mode);
                        setShowSummaryMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        summaryMode === mode
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {mode === 'net' ? 'Net' : mode === 'income' ? 'Income' : 'Expenses'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Amount */}
            <div className="mt-1">
              <span
                className={`text-3xl font-bold tracking-tight ${
                  summaryMode === 'net' && netAmount < 0 ? 'text-red-200' : 'text-white'
                }`}
              >
                {summaryMode === 'expense' ? '-' : summaryMode === 'net' && netAmount < 0 ? '-' : ''}
                {formatCurrency(Math.abs(summaryValue), settings)}
              </span>
            </div>

            {/* Income / Expense Breakdown */}
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 9V3M3 5l3-3 3 3" />
                  </svg>
                </span>
                <span className="text-sm text-white/70">
                  {formatCurrency(totalIncome, settings)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 3v6M3 7l3 3 3-3" />
                  </svg>
                </span>
                <span className="text-sm text-white/70">
                  {formatCurrency(totalExpenses, settings)}
                </span>
              </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute top-3 right-4 w-20 h-20 rounded-full bg-white/5" />
            <div className="absolute -bottom-4 -right-2 w-28 h-28 rounded-full bg-white/5" />
          </div>
        </div>

        {/* ---- Timeframe Selector ---- */}
        <div className="px-4 pt-3 pb-1">
          {/* Timeframe Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
            {TIMEFRAME_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTimeframeChange(key)}
                className={`flex-1 py-1.5 px-1 text-xs font-medium rounded-lg transition-all ${
                  timeframe === key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date Range Navigation */}
          <div className="flex items-center justify-between mt-3 px-1">
            <button
              onClick={() => handleNavigate('prev')}
              disabled={isAllTime}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isAllTime
                  ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label="Previous period"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {dateRangeLabel}
            </span>
            <button
              onClick={() => handleNavigate('next')}
              disabled={isAllTime}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isAllTime
                  ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label="Next period"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* ---- Transaction List ---- */}
        <div className="px-4 pt-3">
          {sortedTransactions.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                emoji="📭"
                title="No transactions"
                subtitle={
                  searchQuery
                    ? `No results for "${searchQuery}"`
                    : filterType !== 'all'
                    ? `No ${filterType} transactions in this period`
                    : 'Start tracking by adding your first transaction'
                }
                action={
                  !searchQuery && filterType === 'all'
                    ? { label: 'Add Transaction', onClick: onAddTransaction }
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="space-y-5">
              {Array.from(groupedTransactions.entries()).map(([dateKey, txns]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {getDateLabel(dateKey)}
                    </span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      {(() => {
                        const dayTotal = (txns as Transaction[]).reduce(
                          (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                          0
                        );
                        const prefix = dayTotal >= 0 ? '+' : '';
                        return prefix + formatCurrency(dayTotal, settings);
                      })()}
                    </span>
                  </div>

                  {/* Transaction Cards */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
                    {(txns as Transaction[]).map((txn) => {
                      const category = categoryMap.get(txn.categoryId);
                      const isExpense = txn.type === 'expense';
                      const isSwiping = swipingId === txn.id;

                      return (
                        <div key={txn.id} className="relative overflow-hidden">
                          {/* Delete Background (visible on swipe) */}
                          <div className="absolute inset-y-0 right-0 flex items-center bg-red-500 transition-opacity"
                            style={{ width: '80px', opacity: isSwiping && swipeOffset > 10 ? 1 : 0 }}
                          >
                            <button
                              onClick={handleDeleteSwipedItem}
                              className="w-full h-full flex items-center justify-center text-white"
                              aria-label="Delete transaction"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>

                          {/* Transaction Row */}
                          <div
                            className="relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 transition-transform cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50"
                            style={{
                              transform: isSwiping ? `translateX(-${swipeOffset}px)` : 'translateX(0)',
                              transition: isSwiping ? 'none' : 'transform 0.3s ease',
                            }}
                            onTouchStart={(e) => handleTouchStart(txn.id, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onClick={() => {
                              if (swipingId && swipingId !== txn.id) {
                                setSwipingId(null);
                                setSwipeOffset(0);
                              }
                              if (!swipingId || swipeOffset < 10) {
                                onEditTransaction(txn);
                              }
                            }}
                          >
                            {/* Category Emoji */}
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                              style={{
                                backgroundColor: category ? `${category.color}15` : '#f3f4f6',
                              }}
                            >
                              {category?.emoji || '💸'}
                            </div>

                            {/* Name and Note */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {category?.name || 'Unknown'}
                              </p>
                              {txn.note && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                  {txn.note}
                                </p>
                              )}
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0">
                              <span
                                className={`text-sm font-semibold ${
                                  isExpense
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-emerald-500 dark:text-emerald-400'
                                }`}
                              >
                                {isExpense ? '-' : '+'}
                                {formatCurrency(txn.amount, settings)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Padding for TabBar */}
        <div className="h-6" />
      </div>

      {/* ---- Search Modal ---- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col animate-fadeIn">
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by note, category, or amount..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={closeSearch}
              className="text-sm font-medium text-primary shrink-0 hover:opacity-70 transition-opacity"
            >
              Cancel
            </button>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim() && filteredTransactions.length === 0 ? (
              <div className="mt-12">
                <EmptyState
                  emoji="🔍"
                  title="No results found"
                  subtitle={`Nothing matches "${searchQuery}"`}
                />
              </div>
            ) : !searchQuery.trim() ? (
              <div className="mt-12">
                <EmptyState
                  emoji="🔎"
                  title="Search transactions"
                  subtitle="Search by note, category name, or amount"
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {sortedTransactions.map((txn) => {
                  const category = categoryMap.get(txn.categoryId);
                  const isExpense = txn.type === 'expense';
                  return (
                    <button
                      key={txn.id}
                      onClick={() => {
                        closeSearch();
                        onEditTransaction(txn);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{
                          backgroundColor: category ? `${category.color}15` : '#f3f4f6',
                        }}
                      >
                        {category?.emoji || '💸'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {category?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {txn.note || getDateLabel(txn.date)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold shrink-0 ${
                          isExpense
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(txn.amount, settings)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Delete Confirmation Dialog ---- */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
