# Miniature Life — Story Studio

Synced Next.js + Postgres rebuild of the single-file Studio (see `index.html` for the legacy browser-only version).

Features:
- Five Miniature Life characters preloaded with their character bible.
- Upload/replace a reference image for each character (<=2MB, resized to max 1024px, stored as base64 data URL).
- Rename/edit characters or add new ones.
- Save multiple OpenAI-compatible model configurations (label, provider, base URL, model, API key) in the DB.
- Select which model powers the story collaboration.
- Rough idea -> polished premise -> scene-by-scene story -> pro shoot-ready script + copy-ready AI video prompts -> posting checklist.
- Browser never calls providers; only `POST /api/chat` with `{ modelId, messages }`.
- Single-user cookie gate via `APP_PASSWORD`.
- PWA manifest (`Miniature Life`) for phone Add-to-Home.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — Neon Postgres connection string, e.g. `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require`
- `APP_PASSWORD` — single-user gate password (also used as the `ml-auth` cookie value)

## Database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

On Vercel/production use `prisma migrate deploy` instead, then seed once.

## Develop / build

```bash
npm run dev
npm run build
```

## Deploy (Vercel free + Neon free)

1. Create a Neon project, copy the `DATABASE_URL`.
2. `prisma migrate deploy`, then seed the 5 bible characters.
3. Create a Vercel project from this repo; set env vars `DATABASE_URL` and `APP_PASSWORD`; deploy.
4. Open `/login`, enter the `APP_PASSWORD` once per device to set the `ml-auth` cookie.

## Phone: Add to Home Screen

Open the deployed URL on your phone, log in, then use the browser share menu -> "Add to Home Screen". The PWA manifest name is **Miniature Life**.

## Add providers (Models page)

Open `/models` and add one row per provider: Provider dropdown (OpenAI/OpenRouter/Groq/Gemini/Custom) + Label + Base URL + Model + API key. Keys are stored in your DB (single-user), never in env. Set one model as default/selected; the Studio and Pipeline use the selected model via `POST /api/chat`.

## Import old app data

Open `/import`, paste the export JSON from the old `index.html` (`{"characters": [...]}`), then Import. Each character is POSTed to `/api/characters`.
