# Dime — iOS-style expense tracker

A personal expense and income tracker built as a single-page web app with an **iOS-native feel**: bottom tab bar, sheet modals, safe-area-aware layout, and system typography. No account required; data is stored in the browser (localStorage).

**Repository:** [github.com/tomlupo/ios-replication](https://github.com/tomlupo/ios-replication)

## Features

- **Log** — Transactions by timeframe (Today / Week / Month / Year / All), net/income/expense summary, search, and filter
- **Insights** — Spending and income breakdown by category and period
- **Budget** — Overall and per-category budgets with progress
- **Settings** — Currency, theme (light/dark/system), categories, export/import/clear data

## Tech stack

| Layer     | Tech |
|----------|------|
| Build    | [Vite](https://vite.dev/) 7 |
| UI       | [React](https://react.dev/) 19 |
| Language | [TypeScript](https://www.typescriptlang.org/) 5.9 |
| Styling  | [Tailwind CSS](https://tailwindcss.com/) 4 |
| Dates    | [date-fns](https://date-fns.org/) 4 |
| State    | Custom store + hooks, persisted to localStorage |

No router; navigation is tab-based within a single page.

## Getting started

### Prerequisites

- Node.js 18+
- npm (or compatible package manager)

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). For a quick tunnel (e.g. to test on a phone):

```bash
npm run tunnel
```

### Build for production

```bash
npm run build
```

Output is in `dist/`. Preview the production build:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project structure

```
src/
├── App.tsx              # Root layout, tab state, modals
├── main.tsx
├── index.css            # Tailwind, theme, global styles, animations
├── components/
│   ├── TabBar.tsx      # Bottom nav + FAB
│   ├── log/            # Log view (list, summary, filters)
│   ├── insights/       # Insights view (charts, breakdown)
│   ├── budget/         # Budget view (overall + category)
│   ├── settings/       # Settings view
│   ├── transaction/    # Add/Edit transaction form
│   ├── category/       # Category manager
│   └── common/         # Modal, Toast, ConfirmDialog, EmptyState
├── store/              # localStorage persistence (categories, transactions, budgets, settings)
├── hooks/              # useStore-derived hooks
├── types/              # Shared TypeScript types and defaults
└── utils/              # format, dateUtils
```

## Design (iOS vibe)

- **PWA-friendly:** `viewport-fit=cover`, `apple-mobile-web-app-capable`, theme-color for status bar
- **Safe areas:** Tab bar and form footers use `env(safe-area-inset-bottom)`
- **Typography:** System font stack (`-apple-system`, SF Pro Display, etc.)
- **UI patterns:** Bottom sheet modals, frosted tab bar, grouped rounded cards, segmented controls
- **Animations:** Sheet slide-up, light fade/scale; short durations

## Data and privacy

All data stays in your browser. No server or account. Export (JSON) and import are available in Settings.

## Documentation

- **[PRD.md](./PRD.md)** — Product requirements, feature scope, data model, and out-of-scope items

## License

Private / unlicensed unless stated otherwise.
