# Miniature Life Story Studio — Full-Stack Upgrade Design
Date: 2026-09-24
Status: Draft for user review
Approach: A — Full-stack app (approved)

## 1. Context
Current app is a single `index.html` (~156 lines) with inline CSS/JS, IndexedDB (`miniature-life-studio-v1`) for characters/models/stories, and direct browser-to-LLM `fetch` to OpenAI-compatible `/chat/completions`.
Pains confirmed:
- Total JS parse failure killed all tabs (fixed: invalid regex on endpoint line, missing `#addChar` wiring, fragile global ID refs, literal `\n`).
- Even when fixed: CORS failures per provider, API keys in browser JS, no phone+PC sync, no TikTok video-prompt workflow, images trapped in one browser.

Source ideas: `chat history.txt` defines pillars — Mini Lagos, Tiny Problems, Tiny Workers + Horror/Football/Animals variety, recurring characters, 15–35s hook-first videos.

## 2. Goals (approved)
- G1: Use on phone + PC with sync.
- G2: Safe AI that just works: backend proxy, multi-provider BYOK form (provider label, base URL, model name, API key) stored in app DB, single-user so env secrets not required.
- G3: TikTok pipeline: idea → polished premise → scenes → professional shoot-ready script + copy-ready AI video prompts → posting checklist.
- Non-goal: multi-user auth, billing, video rendering in-app, social scheduling. YAGNI.

## 3. Architecture (Section 1 — approved)
- Next.js App Router single repo, deployed on Vercel free tier.
- Postgres on Neon free tier via Prisma ORM.
- Single-user password gate: one `APP_PASSWORD` env or first-run set password, cookie session. No OAuth.
- API routes:
  - `GET/POST/DELETE /api/models` — CRUD, `PATCH /api/models/select`
  - `GET/POST/PUT/DELETE /api/characters` (multipart image upload)
  - `GET/POST/PUT/DELETE /api/stories`
  - `POST /api/chat` — proxy only. Body: `{ modelId, messages }`. Server loads model row (baseUrl, model, apiKey), forwards to `{baseUrl}/chat/completions` with timeout 60s, returns provider text or normalized error.
- Browser never calls providers directly → CORS eliminated.
- Images phase 1: stored as bytea / base64 in Postgres (keeps free tier simple, <2MB limit, resize to 1024px). Phase 2 migrate to Vercel Blob / R2 without API change.
- Env needed: `DATABASE_URL`, `APP_PASSWORD`. Provider keys live in DB per user request.

## 4. Data model (Section 2 — approved)
- `Model { id, label, provider, baseUrl, model, apiKey, isSelected, createdAt }`
- `Character { id, name, role, height, color, bibleDetails, imageUrl?, createdAt }`
  - Seed with existing 5: Baba Six, Kola, Amaka, Uncle T, Small with current bible text.
- `Story { id, title, idea, goal, chat JSON, premise, scenes JSON, scriptMarkdown, videoPrompts JSON, checklist JSON, updatedAt }`
- `Scene { n, slug, durationSec, setting, backgroundTheme, lighting, beats[], camera{shotSize, angle, movement, lens}, dialogue[], sound{ sfx[], music, timestamps }, transition, aiPrompt, negativePrompt }`
- Migration: old app gets Export JSON button (characters+stories); new app Import page accepts it.

## 5. UI
- Keep 4 views + add Pipeline:
  - Studio (polish chat via `/api/chat`), Characters, Stories, Models (BYOK form: Provider dropdown [OpenAI/OpenRouter/Groq/Gemini/Custom] + Label + Base URL + Model + API key + Set Default), Pipeline.
- Pipeline steps with persistent state per story:
  1. Idea + goal → Polish (calls proxy with system prompt incl. character bible).
  2. Scenes table (editable duration, beats).
  3. Generate Pro Script (one proxy call returning structured JSON validated by Zod, rendered as formatted script + per-scene copy buttons).
  4. Posting checklist (hook in first 2s, captions, hashtags, sound, cover).
- Mobile responsive, PWA manifest for phone Add-to-Home.

## 6. Pro script format (Section 3 — approved, user-amended)
System prompt forces this JSON per scene, then rendered Markdown:
1. `SLUG + duration` e.g. `INT. GIANT KITCHEN - DAY (0-6s)`
2. Background theme: setting, set dressing, scale gags (giant objects).
3. Lighting/mood: e.g. warm tungsten, soft window key.
4. Action beats: 3–5 visual beats, no unfilmable action.
5. Camera — professional: shot size (ECU/CU/MS/WS), angle (eye-level/low/high/dutch), movement (static/push-in/dolly-in/crane-down/handheld-pan/tracking), lens (24/35/50mm), motivation.
6. Dialogue with character voice + pidgin where fitting.
7. Sound: SFX with timestamps, music bed, silence hits.
8. Transition to next scene.
9. `aiPrompt`: single copy-ready paragraph optimized for Veo/Kling/Runway/Pika: characters + scale + setting + lighting + camera movement + action + mood. `negativePrompt`: e.g. extra fingers, morphing faces, text artifacts.
- Prepended `CONSISTENCY_BLOCK` auto-built from bible: `Baba Six: dark warm-brown skin, cream shirt...` to keep characters stable across scenes.
- Export: Copy per scene, Copy all, Download .md.

## 7. Error handling
- Proxy maps provider non-200 to `{ error, providerBodySnippet }` shown in chat status, never leaks full key.
- Missing model → `Select or add a model in Models first.`
- Timeout/abort → retry button, keeps user message.
- Image >2MB → client resize or reject with message.
- DB down → friendly empty states.

## 8. Testing
- `POST /api/chat` unit test with mocked provider (200 + 401 paths).
- Zod validation test for script JSON (reject malformed, accept minimal).
- Playwright smoke: add model → polish idea → generate 3-scene script → copy prompt.
- Import test: old IndexedDB export JSON imports 5 characters.

## 9. Deployment (free)
1. `npx create-next-app`, add Prisma + Neon `DATABASE_URL`.
2. `prisma migrate deploy`, seed bible.
3. Vercel project, set `APP_PASSWORD`, deploy.
4. Phone: open URL, Add to Home Screen, set same password.
5. Add providers on Models page (keys stored in your DB, single-user).

## 10. Open questions — none blocking. Awaiting user spec review before writing-plans.
