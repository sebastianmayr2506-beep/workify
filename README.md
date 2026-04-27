# Workify

Kunden-, Projekt- & Aufgabenverwaltung mit Zeiterfassung und AI-gestütztem Ticket-Import.

**Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Google Gemini

---

## Lokales Setup

### 1. Voraussetzungen

- Node.js 20+
- pnpm (`curl -fsSL https://get.pnpm.io/install.sh | sh -`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- Ein neues Supabase-Projekt (supabase.com → New Project)

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Environment-Variablen

```bash
cp .env.local.example .env.local
```

Werte eintragen (Supabase Project Settings → API):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GEMINI_API_KEY`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### 4. Datenbank-Migrations ausführen

Im Supabase-Dashboard unter **SQL Editor** alle Migrations der Reihe nach ausführen:

```
supabase/migrations/20240427000001_enums.sql
supabase/migrations/20240427000002_core_tables.sql
supabase/migrations/20240427000003_indexes.sql
supabase/migrations/20240427000004_rls_policies.sql
supabase/migrations/20240427000005_storage.sql
```

Oder via CLI (wenn Supabase CLI mit dem Projekt verknüpft ist):
```bash
supabase db push
```

### 5. TypeScript-Typen generieren

```bash
pnpm supabase gen types typescript --project-id <deine-project-id> > src/types/database.ts
```

### 6. Dev-Server starten

```bash
pnpm dev
```

Öffne http://localhost:3000 — du wirst zur Login-Seite weitergeleitet.

### 7. Ersten User anlegen

Im Supabase-Dashboard → **Authentication → Users → Add User** (Email + Passwort setzen).

---

## Supabase Auth-Callback konfigurieren

Im Supabase-Dashboard → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (lokal) / deine Vercel-URL (Produktion)
- Redirect URLs: `http://localhost:3000/auth/callback`

---

## Deployment (Vercel)

```bash
vercel --prod
```

Environment-Variablen im Vercel-Projekt-Dashboard hinterlegen (gleiche wie `.env.local`), `NEXT_PUBLIC_APP_URL` auf die Vercel-URL setzen.

---

## Phasenplan

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation (Setup, Auth, Layout, Migrations) | ✅ |
| 2 | Core CRUD (Kunden, Projekte, Tasks, Meetings) | ⏳ |
| 3 | Time Tracking | ⏳ |
| 4 | "Heute"-Ansicht | ⏳ |
| 5 | Globale Fragen-Übersicht | ⏳ |
| 6 | Templates | ⏳ |
| 7 | AI-Import (Gemini) | ⏳ |
| 8 | Reports | ⏳ |
