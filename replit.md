# Open Arms — Project Reference

## Overview

Full-stack nonprofit web application for a Philippine NGO supporting survivors of sexual abuse and trafficking. Philippines-based (Luzon / Visayas / Mindanao), currency PHP (₱).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript (`/frontend`) |
| Backend | .NET 10 C# Web API (`/backend`) |
| Database | Supabase PostgreSQL (accessed via PostgREST REST API) |
| Package manager | npm (frontend) / dotnet CLI (backend) |
| Charts | Recharts |
| HTTP client | Axios + TanStack React Query |
| Icons | Lucide React |

## Running the App

- **Frontend**: `npm --prefix /home/runner/workspace/frontend run dev` (workflow: `artifacts/open-arms: web`)
- **Backend API**: `dotnet run --project /home/runner/workspace/backend/OpenArms.Api.csproj` (workflow: `artifacts/api-server: API Server`)

## Authentication

- Session-based staff login via `POST /api/auth/login`
- Staff credentials: `staff.openarms` / `OpenArms2025!`
- Admin panel at `/admin` — redirects to `/login` if unauthenticated

## Key Files

```
/frontend/src/
  App.tsx                   — Router + lang state (EN | TL)
  lib/api.ts                — All API calls (axios to /api/*)
  components/
    PublicLayout.tsx         — Public nav (EN/TL toggle, cookie banner)
    AdminLayout.tsx          — Admin sidebar nav
  pages/
    Home.tsx                 — Public homepage (bilingual)
    Impact.tsx               — Public impact dashboard (bilingual)
    Privacy.tsx              — Privacy policy (bilingual)
    Login.tsx                — Staff login form
    admin/
      Dashboard.tsx          — KPIs + high-risk alerts + recent donations
      Residents.tsx          — Case list (filter by safehouse/risk/status)
      ResidentDetail.tsx     — Individual case file
      Donors.tsx             — Donor list + lapse risk
      DonorDetail.tsx        — Donor profile + giving history
      Donations.tsx          — Full donation log
      Safehouses.tsx         — Safehouse management + capacity
      Partners.tsx           — Partner organization directory
      Incidents.tsx          — Incident reports
      SocialMedia.tsx        — Social media performance
      Analytics.tsx          — Charts and trends

/backend/
  OpenArms.Api.csproj
  Controllers/
    AuthController.cs
    AnalyticsController.cs
    DonationsController.cs
    IncidentsController.cs
    PartnersController.cs
    PublicController.cs
    ResidentsController.cs
    SafehousesController.cs
    SocialMediaController.cs
    SupportersController.cs
  Services/
    SupabaseService.cs       — PostgREST HTTP client (CRITICAL: see notes below)
  Models/
    Models.cs                — All C# model classes
```

## Supabase / PostgREST Critical Notes

The backend talks to Supabase via PostgREST using the service role key.

**CRITICAL — do NOT use PostgREST resource embedding** (e.g. `select=*,safehouses(name)`)  
Joins must be done separately in C# — fetch each table independently and join in-memory.

**CRITICAL — numeric JSON quirks:**
- `SupabaseService` has `JsonNumberHandling.AllowReadingFromString` set globally — Postgres `numeric` columns come back as JSON strings like `"3313.0"`
- `SanitizeJson()` replaces `"NaN"` / `"Infinity"` strings with `null` before deserialization
- All money/stat fields in models use `decimal?` (nullable)

**Environment variables used by backend:**
- `SUPABASE_URL` — e.g. `https://xxx.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (secret)

## Database Tables (Supabase PostgreSQL)

| Table | Primary Key | Notes |
|---|---|---|
| `safehouses` | `safehouse_id` | Locations across Philippines |
| `residents` | `resident_id` | Case records (anonymized by case code) |
| `home_visitations` | — | Family/guardian visit logs |
| `health_wellbeing_records` | — | Medical check records |
| `process_recordings` | — | Counseling sessions |
| `supporters` | `supporter_id` | Donors and supporters |
| `donations` | `donation_id` | Donation transactions (PHP) |
| `partners` | `partner_id` | Partner NGOs, government, law enforcement |
| `incident_reports` | `incident_id` | Incident reports |
| `social_media_posts` | `post_id` | Social media campaign tracking (7 platforms) |

**Actual data volumes:** 60 residents (30 active), 9 safehouses, 420 donations, 60 supporters, 100 incidents, 812 social media posts

## Public Site Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, mission, impact stats, faith section, CTA |
| `/impact` | Public impact dashboard — live stats, donation trends chart, safehouse list |
| `/privacy` | Privacy policy |

All public pages support **EN / TL (Tagalog)** language toggle in the navbar.

## Admin Portal Routes

| Route | Description |
|---|---|
| `/admin` | Dashboard — KPIs, active high-risk cases, recent donations |
| `/admin/residents` | Case management list |
| `/admin/residents/:id` | Individual case file |
| `/admin/donors` | Donor list with lapse risk |
| `/admin/donors/:id` | Donor profile |
| `/admin/donations` | Full donation log |
| `/admin/safehouses` | Safehouse management |
| `/admin/partners` | Partner directory |
| `/admin/incidents` | Incident tracking |
| `/admin/social-media` | Social media metrics (Facebook, Instagram, Twitter/X, TikTok, YouTube, LinkedIn, WhatsApp) |
| `/admin/analytics` | Detailed analytics + charts |

## Backend API Endpoints

- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me`
- `GET /api/public/impact-snapshot` / `safehouses` / `donation-trends` / `outcome-metrics`
- `GET/POST/PUT/DELETE /api/safehouses`
- `GET/POST/PUT/DELETE /api/residents` — includes nested session/visitation/health/education data
- `GET/POST/PUT/DELETE /api/supporters`
- `GET/POST/PUT/DELETE /api/donations`
- `GET/POST/PUT/DELETE /api/partners`
- `GET/POST/PUT/DELETE /api/incidents`
- `GET /api/analytics/dashboard` / `trends` / `at-risk` / `lapsing-donors` / `safehouse-comparison`
- `GET/POST/PUT/DELETE /api/social-media`
