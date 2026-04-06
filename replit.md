# Open Arms — Workspace

## Overview

Full-stack nonprofit web application for an Indonesian NGO supporting survivors of sexual abuse and trafficking. Built as a pnpm monorepo with TypeScript throughout.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/open-arms)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Auth**: express-session (cookie-based, session stored server-side)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in lib/api-spec)
- **Charts**: Recharts
- **Build**: esbuild

## Auth

- Session-based login via `POST /api/auth/login`
- Password hashing: `sha256(password + "open_arms_salt_2024")`
- Default admin: username `admin`, password `Admin@2024!`
- Default staff: username `staff.sarah` / `staff.budi`, password `Staff@2024!`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/open-arms run dev` — run frontend locally

## Application Structure

### Public Site (`/`)
- Homepage with bilingual EN/ID toggle, hero section, impact stats, contact form
- `/impact` — Public impact dashboard (live DB stats, donation trends chart, safehouse map)
- `/privacy` — Privacy policy with cookie consent banner

### Staff Portal (`/admin`)
Requires authentication (redirect to `/login` if unauthenticated)
- `/admin` — Main dashboard (KPIs, high-risk alerts, recent donations)
- `/admin/residents` — Case management list with filtering by safehouse/risk/status
- `/admin/residents/:id` — Individual case file (sessions, visitations, health, education, interventions)
- `/admin/donors` — Donor management with lapse risk analysis
- `/admin/donors/:id` — Individual donor profile and giving history
- `/admin/donations` — Full donation log
- `/admin/safehouses` — Safehouse management and capacity comparison
- `/admin/partners` — Partner organization directory
- `/admin/incidents` — Incident reporting and tracking
- `/admin/social-media` — Social media performance tracking
- `/admin/analytics` — Detailed analytics and charts

## Database Schema (lib/db/src/schema)

- `users` — Staff accounts with roles (admin, staff, donor)
- `safehouses` — Safehouse locations across Indonesia
- `residents` — Resident case records (anonymized by case code)
- `process_recordings` — Counseling sessions
- `visitations` — Family/guardian visit logs
- `health_records` — Medical check records
- `education_records` — School/training enrollment
- `interventions` — Therapeutic/legal intervention logs
- `risk_indicators` — Flagged risk events
- `supporters` — Donors and partner organizations
- `donations` — Donation transactions
- `partners` — Partner NGOs, government, law enforcement
- `incidents` — Incident reports
- `social_media_posts` — Social media campaign tracking

## API Routes (artifacts/api-server/src/routes)

- `auth` — login, logout, me
- `public` — impact-snapshot, safehouses map, donation-trends, outcome-metrics, contact
- `safehouses` — CRUD for safehouse management
- `residents` — CRUD + nested routes for sessions, visitations, health, education, interventions, risk indicators
- `supporters` — CRUD with lapse risk
- `donations` — CRUD with summary
- `partners` — CRUD
- `incidents` — CRUD
- `analytics` — dashboard, trends, at-risk residents, lapsing donors, safehouse comparison
- `social_media` — CRUD with metrics
