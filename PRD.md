# Product Requirements Document: Dime

## 1. Overview

**Product name:** Dime  
**Product type:** Personal expense-tracking web application  
**Design goal:** iOS-native feel in the browser: familiar patterns, safe areas, sheet modals, and system typography so the app feels at home on iPhone and works well on desktop.

---

## 2. Users & Audience

- Individuals who want to track income and expenses quickly.
- Users who prefer a mobile-first, app-like experience in the browser (including Add to Home Screen).
- No account required; all data stays in the browser (localStorage).

---

## 3. Goals & Success Criteria

- **Primary:** Fast, low-friction logging of transactions with clear summaries and budgets.
- **Secondary:** Visual and interaction parity with common iOS finance apps (grouped lists, bottom sheets, tab bar).
- **Success:** Users can add transactions in a few taps, see net/income/expense at a glance, set and monitor budgets, and optionally export/import data.

---

## 4. Features (In Scope)

### 4.1 Log (Transaction List)

- **Timeframes:** Today, This Week, This Month, This Year, All Time (with date navigation where applicable).
- **Summary card:** Net / Income / Expenses for the selected period (toggleable).
- **Filter:** All, Income only, Expense only.
- **Search:** By category name, note, or amount.
- **Transaction list:** Grouped by date; each row shows category (emoji + name), note, amount, type (income/expense).
- **Actions:** Tap to edit; swipe or action to delete.
- **Add:** FAB in tab bar opens transaction form.

### 4.2 Transaction Form (Add / Edit)

- **Type:** Expense or Income (segmented).
- **Amount:** Numeric input with optional decimals; currency from settings.
- **Category:** Picker from expense or income categories.
- **Note:** Optional text.
- **Date & time:** Date picker and time.
- **Recurring:** Toggle + interval (Daily, Weekly, Monthly, Yearly).
- **Actions:** Save, (when editing) Delete, with confirmation where destructive.

### 4.3 Insights

- **Spending/income overview** for a selectable period.
- **Breakdown by category:** Charts and/or lists (e.g. by expense category).
- **Time range selector** consistent with Log (day/week/month/year).

### 4.4 Budget

- **Overall budget:** Single budget for total spending in a chosen timeframe (daily/weekly/monthly/yearly).
- **Category budgets:** Optional per-category spending limits in a timeframe.
- **Progress:** Visual indication of spent vs limit (e.g. progress bar, percentage).
- **Alerts / state:** Indication when over or near limit (e.g. color, label).

### 4.5 Categories

- **Default sets:** Predefined expense and income categories (name, emoji, color).
- **Category manager (Settings):** Add, edit, reorder, delete categories.
- **Per-category:** Name, emoji, color, type (expense/income).

### 4.6 Settings

- **Currency:** Pick from a fixed list (e.g. USD, EUR, GBP, JPY, …); symbol and code drive formatting.
- **Appearance:** Theme — Light, Dark, System.
- **Calendar:** First day of week (Sun/Mon); start day of month (for custom “month” boundaries if used).
- **Display:** Show decimals / show cents (for amounts).
- **Categories:** Entry point to Category Manager.
- **Data:** Export (JSON download), Import (JSON file), Clear all data (with confirmation).

---

## 5. Data Model (Summary)

- **Categories:** id, name, emoji, color, type (expense | income), order.
- **Transactions:** id, amount, note, categoryId, date (ISO), type, isRecurring, recurringInterval?, createdAt.
- **Budgets:** id, amount, type (overall | category), categoryId?, timeframe (daily | weekly | monthly | yearly), startDay, createdAt.
- **Settings:** currency, currencySymbol, showDecimals, darkMode, firstDayOfWeek, startDayOfMonth, showCents.

Persistence: browser **localStorage** only (no backend). Keys prefixed (e.g. `dime_*`) for namespacing.

---

## 6. Technical Stack

| Area        | Choice |
|------------|--------|
| Build      | Vite 7 |
| UI         | React 19 |
| Language   | TypeScript 5.9 |
| Styling    | Tailwind CSS 4 |
| Dates      | date-fns 4 |
| IDs        | uuid |
| State      | Custom store + React hooks; persistence via store writing to localStorage |
| Routing    | None (single page; tab-based navigation) |

---

## 7. UX / iOS Alignment

- **Viewport & PWA:** `viewport-fit=cover`, `apple-mobile-web-app-capable`, theme-color for status bar.
- **Safe areas:** Bottom tab bar and form footers use `env(safe-area-inset-bottom)` so content clears the home indicator.
- **Typography:** System font stack (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, …).
- **Navigation:** Fixed bottom tab bar (Log, Insights, Budget, Settings) with center FAB for “Add”.
- **Modals:** Bottom sheet on mobile (slide-up), rounded sheet; backdrop blur.
- **Lists:** Grouped, rounded cards (`rounded-2xl`); segmented controls for toggles.
- **Animations:** Sheet slide-up, light fade/scale for overlays; short durations (e.g. 0.2–0.3s).

---

## 8. Out of Scope (Current Version)

- User accounts, sign-in, or cloud sync.
- Backend or API; all data is local.
- Notifications or reminders (e.g. budget alerts).
- Multi-currency conversion or exchange rates.
- Receipt scanning or photo attachment.
- Recurring transaction auto-generation (recurring is metadata only in current scope).

---

## 9. Future Considerations (Optional)

- Optional sync (e.g. export/import to cloud or file).
- Budget alerts (browser notifications or in-app).
- Recurring transactions that auto-create entries.
- Optional PWA install prompt and offline support improvements.
- Accessibility audit and keyboard/screen-reader refinements.

---

## 10. Document Info

- **PRD version:** 1.0  
- **Last updated:** 2025-02  
- **Status:** Describes current product scope and implementation.
