# FitMD — Markdown-first Fitness Workspace

A **notebook-first fitness workspace** that combines the best of Obsidian (markdown notes), Stryd (workout execution), TrainerRoad (training plans), and AI coaching. Write workouts like notes, execute them like a dedicated training app.

**Single source of truth = `.md` files**

## Features

### ✍️ Notebook Mode (Obsidian-like)
- TipTap Markdown editor with live preview
- File tree with folders: `/workouts`, `/plans`, `/logs`, `/notes`, `/clients`
- Internal links `[[Push Day]]` and tags `#hypertrophy`
- **AI Normalize** button to convert messy notes → structured format

### 🏃 Workout Mode (Stryd-like)
- Large timers, next/complete buttons, auto rest
- **Zero typing during workout** — tap only
- Real-time progress tracking
- Automatic set logging

### 📊 Analytics Mode
- Weekly volume charts
- Personal record detection
- Progression tracking per exercise
- Compliance & streak tracking
- CSV/JSON export

### 👥 Coach Mode
- Client management
- Assign training plans
- View compliance & progress
- Add notes per client

### 🤖 AI Coach
- Generate workouts from goals/constraints
- Adapt based on fatigue levels
- Suggest progressions
- Auto-periodization

## Workout Markdown Format

```markdown
# Push Day

@duration 45m
@goal hypertrophy

## Bench Press
4x5 @80kg
rest 120s
rpe 8

## Superset
## Lateral Raise
3x12 @10kg

## Tricep Pushdown
3x12 @25kg
rest 60s

> Focus on mind-muscle connection
```

**Flow:** `user text → AI normalize → parser → JSON → workout engine`

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Editor | [TipTap](https://tiptap.dev/) (ProseMirror) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Database | PostgreSQL ([Neon](https://neon.tech/) / [Supabase](https://supabase.com/)) |
| ORM | [Prisma](https://www.prisma.io/) |
| AI | [OpenAI](https://openai.com/) / [Anthropic Claude](https://anthropic.com/) |
| Auth | [NextAuth.js](https://next-auth.js.org/) v5 |
| Deploy | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Neon/Supabase)

### Install

```bash
npm install
```

### Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL` — Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` — For AI features

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed exercise database
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page (mode switcher)
│   └── globals.css       # Tailwind + custom styles
├── components/
│   ├── providers.tsx     # Theme & app state providers
│   ├── navigation.tsx    # Sidebar + mobile nav
│   ├── editor/           # Notebook mode components
│   │   ├── notebook-mode.tsx
│   │   ├── file-tree.tsx
│   │   ├── markdown-editor.tsx
│   │   └── editor-toolbar.tsx
│   ├── workout/          # Workout execution
│   │   ├── workout-mode.tsx
│   │   ├── workout-selector.tsx
│   │   ├── workout-execution.tsx
│   │   └── workout-complete.tsx
│   ├── analytics/        # Analytics dashboard
│   │   └── analytics-mode.tsx
│   └── coach/            # Coach/client management
│       └── coach-mode.tsx
├── lib/
│   ├── utils.ts          # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── parser.ts         # Markdown → JSON parser
│   └── ai-coach.ts       # AI service
├── hooks/
│   ├── use-workout.ts    # Workout execution state
│   └── use-vault.ts      # File management
└── types/
    └── index.ts          # TypeScript definitions

prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Exercise database seed
```

## Data Model

- **User** — Account with role (USER/COACH/ADMIN)
- **Exercise** — Exercise database with muscles, equipment, tags
- **MarkdownFile** — Virtual vault files stored in DB
- **WorkoutTemplate** — Parsed workout structure
- **WorkoutSession** — Workout execution instance
- **SetLog** — Individual set records
- **Plan** — Training plan with weekly structure
- **Client** — Coach's client with assigned plans
- **Subscription** — AI subscription tiers

## API Routes (Server Actions)

All data operations use Next.js Server Actions for type-safe, zero-config API calls.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database

- **Neon**: Serverless PostgreSQL, auto-scales, generous free tier
- **Supabase**: PostgreSQL + auth + realtime, good for full-stack

## Roadmap

- [ ] Audio cues during workout
- [ ] Watch sync (WearOS/watchOS)
- [ ] Stripe payments for AI subscription
- [ ] Mobile PWA with offline support
- [ ] Video exercise demos
- [ ] Social features (share workouts)

## License

MIT
