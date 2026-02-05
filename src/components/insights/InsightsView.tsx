import { useState, useMemo, useCallback } from 'react';
import { Transaction, Category, Settings, TimeFrame } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/format';
import {
  getDateRange,
  navigateDate,
  formatDateRange,
  getBarLabels,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
} from '../../utils/dateUtils';
import EmptyState from '../common/EmptyState';

interface InsightsViewProps {
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
}

type InsightsTimeFrame = 'week' | 'month' | 'year';

const TIMEFRAME_TABS: { id: InsightsTimeFrame; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

interface CategoryBreakdown {
  category: Category;
  amount: number;
  percentage: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Donut / Pie Chart
// ---------------------------------------------------------------------------

interface DonutChartProps {
  data: CategoryBreakdown[];
  totalAmount: number;
  settings: Settings;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

function DonutChart({ data, totalAmount, settings, selectedIndex, onSelect }: DonutChartProps) {
  const size = 220;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Build segments
  const segments = useMemo(() => {
    let cumulativeOffset = 0;
    return data.map((item, index) => {
      const segmentLength = (item.percentage / 100) * circumference;
      const offset = cumulativeOffset;
      cumulativeOffset += segmentLength;
      return {
        ...item,
        index,
        segmentLength,
        offset,
      };
    });
  }, [data, circumference]);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-800"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segments.map((seg) => {
          const isSelected = selectedIndex === seg.index;
          const isOtherSelected = selectedIndex !== null && selectedIndex !== seg.index;
          return (
            <circle
              key={seg.category.id}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.category.color}
              strokeWidth={isSelected ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={`${seg.segmentLength} ${circumference - seg.segmentLength}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              style={{
                opacity: isOtherSelected ? 0.35 : 1,
              }}
              onClick={() => onSelect(isSelected ? null : seg.index)}
              onMouseEnter={() => onSelect(seg.index)}
              onMouseLeave={() => onSelect(null)}
            />
          );
        })}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {selectedIndex !== null && data[selectedIndex] ? (
          <>
            <span className="text-xl mb-0.5">{data[selectedIndex].category.emoji}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCompactCurrency(data[selectedIndex].amount, settings)}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {data[selectedIndex].percentage.toFixed(1)}%
            </span>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCompactCurrency(totalAmount, settings)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar Graph
// ---------------------------------------------------------------------------

interface BarGraphProps {
  labels: { label: string; date: Date }[];
  expenseValues: number[];
  incomeValues: number[];
  average: number;
  timeframe: InsightsTimeFrame;
  settings: Settings;
}

function BarGraph({ labels, expenseValues, incomeValues, average, timeframe, settings }: BarGraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = Math.max(labels.length * 40, 320);
  const height = 200;
  const paddingTop = 20;
  const paddingBottom = 28;
  const paddingLeft = 4;
  const paddingRight = 4;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  const maxValue = useMemo(() => {
    const allValues = [...expenseValues, ...incomeValues, average];
    return Math.max(...allValues, 1) * 1.15;
  }, [expenseValues, incomeValues, average]);

  const barWidth = useMemo(() => {
    if (labels.length === 0) return 0;
    const slotWidth = chartWidth / labels.length;
    // Two bars per slot (expense + income) + gap
    return Math.min(Math.max(slotWidth * 0.3, 4), 18);
  }, [labels.length, chartWidth]);

  const getY = useCallback(
    (value: number) => paddingTop + chartHeight - (value / maxValue) * chartHeight,
    [maxValue, chartHeight]
  );

  const averageY = getY(average);

  return (
    <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => {
          const y = paddingTop + chartHeight * (1 - frac);
          return (
            <line
              key={frac}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="currentColor"
              className="text-gray-100 dark:text-gray-800"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Bars */}
        {labels.map((item, i) => {
          const slotWidth = chartWidth / labels.length;
          const slotX = paddingLeft + i * slotWidth;
          const centerX = slotX + slotWidth / 2;
          const gap = 2;
          const expVal = expenseValues[i] || 0;
          const incVal = incomeValues[i] || 0;
          const isHovered = hoveredIndex === i;

          const expBarHeight = (expVal / maxValue) * chartHeight;
          const incBarHeight = (incVal / maxValue) * chartHeight;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Hover background */}
              {isHovered && (
                <rect
                  x={slotX}
                  y={paddingTop}
                  width={slotWidth}
                  height={chartHeight}
                  fill="currentColor"
                  className="text-gray-50 dark:text-gray-800/50"
                  rx={4}
                />
              )}

              {/* Expense bar */}
              {expVal > 0 && (
                <rect
                  x={centerX - barWidth - gap / 2}
                  y={paddingTop + chartHeight - expBarHeight}
                  width={barWidth}
                  height={expBarHeight}
                  fill="#EF4444"
                  rx={barWidth / 2}
                  className="transition-all duration-500"
                  style={{
                    opacity: isHovered ? 1 : 0.8,
                    animation: `barGrow 600ms ease-out ${i * 30}ms both`,
                  }}
                />
              )}

              {/* Income bar */}
              {incVal > 0 && (
                <rect
                  x={centerX + gap / 2}
                  y={paddingTop + chartHeight - incBarHeight}
                  width={barWidth}
                  height={incBarHeight}
                  fill="#10B981"
                  rx={barWidth / 2}
                  className="transition-all duration-500"
                  style={{
                    opacity: isHovered ? 1 : 0.7,
                    animation: `barGrow 600ms ease-out ${i * 30 + 100}ms both`,
                  }}
                />
              )}

              {/* X-axis label */}
              <text
                x={centerX}
                y={height - 6}
                textAnchor="middle"
                fill="currentColor"
                className="text-gray-400 dark:text-gray-500"
                fontSize={timeframe === 'month' ? 9 : 10}
              >
                {item.label}
              </text>

              {/* Hover tooltip */}
              {isHovered && (expVal > 0 || incVal > 0) && (
                <g>
                  <rect
                    x={centerX - 42}
                    y={paddingTop - 16}
                    width={84}
                    height={16}
                    rx={4}
                    fill="currentColor"
                    className="text-gray-800 dark:text-gray-200"
                  />
                  <text
                    x={centerX}
                    y={paddingTop - 5}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="600"
                    fill="currentColor"
                    className="text-white dark:text-gray-900"
                  >
                    {expVal > 0 && `E: ${formatCompactCurrency(expVal, settings)}`}
                    {expVal > 0 && incVal > 0 && '  '}
                    {incVal > 0 && `I: ${formatCompactCurrency(incVal, settings)}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Average line */}
        {average > 0 && (
          <>
            <line
              x1={paddingLeft}
              y1={averageY}
              x2={width - paddingRight}
              y2={averageY}
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="6 3"
            />
            <rect
              x={width - paddingRight - 38}
              y={averageY - 8}
              width={36}
              height={16}
              rx={4}
              fill="#F59E0B"
            />
            <text
              x={width - paddingRight - 20}
              y={averageY + 4}
              textAnchor="middle"
              fontSize={8}
              fontWeight="700"
              fill="white"
            >
              AVG
            </text>
          </>
        )}
      </svg>

      {/* Bar animation keyframes */}
      <style>{`
        @keyframes barGrow {
          from {
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            transform: scaleY(1);
            transform-origin: bottom;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main InsightsView
// ---------------------------------------------------------------------------

export default function InsightsView({ transactions, categories, settings }: InsightsViewProps) {
  const [timeframe, setTimeframe] = useState<InsightsTimeFrame>('month');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedPieIndex, setSelectedPieIndex] = useState<number | null>(null);

  // ---- Date navigation ----
  const handlePrev = useCallback(() => {
    setReferenceDate((d) => navigateDate(d, timeframe as TimeFrame, 'prev'));
    setSelectedPieIndex(null);
  }, [timeframe]);

  const handleNext = useCallback(() => {
    setReferenceDate((d) => navigateDate(d, timeframe as TimeFrame, 'next'));
    setSelectedPieIndex(null);
  }, [timeframe]);

  const dateLabel = useMemo(
    () => formatDateRange(timeframe as TimeFrame, referenceDate),
    [timeframe, referenceDate]
  );

  // ---- Filter transactions in current range ----
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(timeframe as TimeFrame, referenceDate, settings.firstDayOfWeek as 0 | 1),
    [timeframe, referenceDate, settings.firstDayOfWeek]
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= rangeStart && d <= rangeEnd;
      }),
    [transactions, rangeStart, rangeEnd]
  );

  // ---- Previous period transactions (for % change) ----
  const prevPeriodTransactions = useMemo(() => {
    const prevDate = navigateDate(referenceDate, timeframe as TimeFrame, 'prev');
    const { start, end } = getDateRange(timeframe as TimeFrame, prevDate, settings.firstDayOfWeek as 0 | 1);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [transactions, referenceDate, timeframe, settings.firstDayOfWeek]);

  // ---- Summary computations ----
  const summary = useMemo(() => {
    const totalExpense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const net = totalIncome - totalExpense;

    const daysInRange = Math.max(
      1,
      Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const avgPerDay = totalExpense / daysInRange;

    // Previous period
    const prevExpense = prevPeriodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const prevIncome = prevPeriodTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;
    const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
    const netChange = prevExpense > 0 || prevIncome > 0
      ? (net - (prevIncome - prevExpense))
      : 0;

    return {
      totalExpense,
      totalIncome,
      net,
      avgPerDay,
      expenseChange,
      incomeChange,
      netChange,
      prevExpense,
      prevIncome,
    };
  }, [filteredTransactions, prevPeriodTransactions, rangeStart, rangeEnd]);

  // ---- Category breakdown (expense) ----
  const expenseBreakdown = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter((t) => t.type === 'expense');
    if (expenseTransactions.length === 0) return [];

    const byCat = new Map<string, { amount: number; count: number }>();
    expenseTransactions.forEach((t) => {
      const existing = byCat.get(t.categoryId) || { amount: 0, count: 0 };
      byCat.set(t.categoryId, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    });

    const total = summary.totalExpense;
    const result: CategoryBreakdown[] = [];

    byCat.forEach((data, catId) => {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) return;
      result.push({
        category: cat,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        count: data.count,
      });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, summary.totalExpense]);

  // ---- Bar graph data ----
  const barData = useMemo(() => {
    const labels = getBarLabels(timeframe as TimeFrame, referenceDate);
    const expenseValues: number[] = [];
    const incomeValues: number[] = [];

    labels.forEach(({ date }) => {
      let periodExpense = 0;
      let periodIncome = 0;

      filteredTransactions.forEach((t) => {
        const tDate = new Date(t.date);

        let matches = false;
        if (timeframe === 'year') {
          matches =
            tDate.getMonth() === date.getMonth() &&
            tDate.getFullYear() === date.getFullYear();
        } else {
          matches = isSameDay(tDate, date);
        }

        if (matches) {
          if (t.type === 'expense') periodExpense += t.amount;
          else periodIncome += t.amount;
        }
      });

      expenseValues.push(periodExpense);
      incomeValues.push(periodIncome);
    });

    const nonZeroExpenses = expenseValues.filter((v) => v > 0);
    const average = nonZeroExpenses.length > 0
      ? nonZeroExpenses.reduce((s, v) => s + v, 0) / nonZeroExpenses.length
      : 0;

    return { labels, expenseValues, incomeValues, average };
  }, [timeframe, referenceDate, filteredTransactions]);

  // ---- Check if current period is in the future ----
  const isCurrentOrPast = useMemo(() => {
    const now = new Date();
    return rangeStart <= now;
  }, [rangeStart]);

  // ---- Helpers ----
  function renderChangeIndicator(change: number, inverse = false) {
    if (change === 0) return null;
    // For expenses, increase is bad (red), for income increase is good (green)
    // If inverse is true, positive change is bad
    const isPositive = change > 0;
    const isGood = inverse ? !isPositive : isPositive;

    return (
      <span
        className={`inline-flex items-center text-[11px] font-medium rounded-full px-1.5 py-0.5 ${
          isGood
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
            : 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
        }`}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`mr-0.5 ${isPositive ? '' : 'rotate-180'}`}
          fill="currentColor"
        >
          <path d="M5 2L8.5 6.5H1.5L5 2Z" />
        </svg>
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  }

  // ---- Empty state ----
  if (transactions.length === 0) {
    return (
      <div className="px-4 pt-4">
        {/* Timeframe tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
          {TIMEFRAME_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setTimeframe(tab.id);
                setSelectedPieIndex(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                timeframe === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <EmptyState
          emoji="📊"
          title="No insights yet"
          subtitle="Start adding transactions to see your spending analytics and trends."
        />
      </div>
    );
  }

  const hasDataInRange = filteredTransactions.length > 0;

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      {/* Timeframe Tabs */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {TIMEFRAME_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setTimeframe(tab.id);
              setReferenceDate(new Date());
              setSelectedPieIndex(null);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              timeframe === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-90"
          aria-label="Previous period"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600 dark:text-gray-300"
          >
            <polyline points="13 15 8 10 13 5" />
          </svg>
        </button>

        <span className="text-base font-semibold text-gray-900 dark:text-white select-none">
          {dateLabel}
        </span>

        <button
          onClick={handleNext}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-90"
          aria-label="Next period"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600 dark:text-gray-300"
          >
            <polyline points="7 5 12 10 7 15" />
          </svg>
        </button>
      </div>

      {/* No data for the current range */}
      {!hasDataInRange && (
        <EmptyState
          emoji="📭"
          title="No transactions"
          subtitle={`No transactions found for ${dateLabel}.`}
        />
      )}

      {hasDataInRange && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Expenses */}
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Expenses
                </span>
                {renderChangeIndicator(summary.expenseChange, true)}
              </div>
              <span className="text-lg font-bold text-red-500 dark:text-red-400">
                {formatCurrency(summary.totalExpense, settings)}
              </span>
            </div>

            {/* Total Income */}
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Income
                </span>
                {renderChangeIndicator(summary.incomeChange)}
              </div>
              <span className="text-lg font-bold text-emerald-500 dark:text-emerald-400">
                {formatCurrency(summary.totalIncome, settings)}
              </span>
            </div>

            {/* Net */}
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Net</span>
              </div>
              <span
                className={`text-lg font-bold ${
                  summary.net >= 0
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                }`}
              >
                {summary.net >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(summary.net), settings)}
              </span>
            </div>

            {/* Average Per Day */}
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Avg / Day
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.avgPerDay, settings)}
              </span>
            </div>
          </div>

          {/* Income vs Expense Comparison Bar */}
          {(summary.totalIncome > 0 || summary.totalExpense > 0) && (
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Income vs Expenses
              </h3>
              <div className="space-y-2.5">
                {/* Income bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Income</span>
                    <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                      {formatCurrency(summary.totalIncome, settings)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          Math.max(summary.totalIncome, summary.totalExpense) > 0
                            ? (summary.totalIncome /
                                Math.max(summary.totalIncome, summary.totalExpense)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Expense bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Expenses</span>
                    <span className="text-xs font-semibold text-red-500 dark:text-red-400">
                      {formatCurrency(summary.totalExpense, settings)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          Math.max(summary.totalIncome, summary.totalExpense) > 0
                            ? (summary.totalExpense /
                                Math.max(summary.totalIncome, summary.totalExpense)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spending Over Time (Bar Graph) */}
          {barData.labels.length > 0 && (
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Spending Over Time
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Expense</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Income</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-amber-500 rounded" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Avg</span>
                  </div>
                </div>
              </div>
              <BarGraph
                labels={barData.labels}
                expenseValues={barData.expenseValues}
                incomeValues={barData.incomeValues}
                average={barData.average}
                timeframe={timeframe}
                settings={settings}
              />
            </div>
          )}

          {/* Pie Chart & Breakdown */}
          {expenseBreakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Expense Breakdown
              </h3>

              {/* Donut Chart */}
              <div className="flex justify-center mb-6">
                <DonutChart
                  data={expenseBreakdown}
                  totalAmount={summary.totalExpense}
                  settings={settings}
                  selectedIndex={selectedPieIndex}
                  onSelect={setSelectedPieIndex}
                />
              </div>

              {/* Category List */}
              <div className="space-y-3">
                {expenseBreakdown.map((item, index) => (
                  <button
                    key={item.category.id}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 ${
                      selectedPieIndex === index
                        ? 'bg-gray-50 dark:bg-gray-700/50 ring-1 ring-gray-200 dark:ring-gray-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    }`}
                    onClick={() =>
                      setSelectedPieIndex(selectedPieIndex === index ? null : index)
                    }
                    onMouseEnter={() => setSelectedPieIndex(index)}
                    onMouseLeave={() => setSelectedPieIndex(null)}
                  >
                    {/* Emoji */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${item.category.color}18` }}
                    >
                      {item.category.emoji}
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.category.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2 shrink-0">
                          {formatCurrency(item.amount, settings)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.category.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 w-10 text-right shrink-0">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
