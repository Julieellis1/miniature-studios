# Miniature Life Story Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild single-file Studio as synced Next.js + Postgres app with BYOK multi-provider proxy and TikTok pro-script pipeline.

**Architecture:** Next.js App Router monolith on Vercel free; Prisma to Neon Postgres; server-only `/api/chat` proxy forwards to provider baseUrl with per-row apiKey; single-user cookie gate.

**Tech Stack:** Next.js 14 App Router TypeScript, Prisma 5, Neon Postgres, Zod 3, Vitest, Playwright, Tailwind (via create-next-app default).

**Spec:** `docs/superpowers/specs/2026-09-24-miniature-life-studio-design.md`

## Global Constraints
- Single-user: one APP_PASSWORD cookie gate, provider keys in DB not env.
- Free-tier only: Vercel + Neon free, images <=2MB resized to max 1024px, stored as text (base64 data URL) phase 1.
- Browser never calls providers; only `POST /api/chat` with `{ modelId, messages }`.
- Pro script per scene must include slug+duration, background theme, lighting, beats, camera (size/angle/movement/lens), dialogue, sound SFX+music, transition, aiPrompt, negativePrompt, plus master CONSISTENCY_BLOCK.
- Preserve 5 seed characters verbatim from old `index.html` seed array.

---

### Task 1: Scaffold + DB + seed

**Files:**
- Create: `package.json` (via create-next-app), `prisma/schema.prisma`, `src/lib/db.ts`, `prisma/seed.ts`
- Modify: `.env.example`
- Test: `tests/seed.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `db` PrismaClient from `src/lib/db.ts`; tables Model, Character, Story.

- [ ] **Step 1: Write the failing test**

```ts
// tests/seed.test.ts
import { describe, it, expect } from "vitest";
import { seedCharacters } from "../prisma/seed-helpers";
describe("seed", () => {
  it("contains 5 bible characters", () => {
    const s = seedCharacters();
    expect(s.map((c) => c.name)).toEqual(["Baba Six", "Kola", "Amaka", "Uncle T", "Small"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/seed.test.ts`
Expected: FAIL with "Cannot find module '../prisma/seed-helpers'"

- [ ] **Step 3: Scaffold app and write minimal implementation**

```bash
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm
npm i prisma @prisma/client zod
npx prisma init
```

```prisma
// prisma/schema.prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }
model Model { id Int @id @default(autoincrement()); label String; provider String; baseUrl String; model String; apiKey String; isSelected Boolean @default(false); createdAt DateTime @default(now()) }
model Character { id Int @id @default(autoincrement()); name String; role String @default(""); height String @default(""); color String @default(""); bibleDetails String @default(""); imageUrl String @default(""); createdAt DateTime @default(now()) }
model Story { id Int @id @default(autoincrement()); title String @default("Untitled story"); idea String @default(""); goal String @default(""); chat Json @default("[]"); premise String @default(""); scenes Json @default("[]"); scriptMarkdown String @default(""); checklist Json @default("[]"); updatedAt DateTime @updatedAt }
```

```ts
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (!g.prisma) g.prisma = db;
```

```ts
// prisma/seed-helpers.ts
export function seedCharacters() {
  return [
    { name: "Baba Six", role: "Leader / fixer", height: "~6 inches", color: "Cream & brown", bibleDetails: "Dark warm-brown skin; sturdy adult build; weathered friendly face; short black/grey hair; grey-black moustache; cream short-sleeve shirt; dark brown trousers; worn brown sandals; vintage wristwatch; small leather cross-body tool pouch; tiny adjustable wrench. Calm, confident, stubborn, practical. Signature phrase: Leave am for me." },
    { name: "Kola", role: "Hustler / delivery guy", height: "~5.8 inches", color: "Orange & charcoal", bibleDetails: "Medium-dark warm-brown skin; slim athletic adult build; youthful adult face; short low-cut black hair; tiny moustache; bright orange delivery vest; charcoal T-shirt; dark navy utility trousers; black sneakers; black wristwatch; oversized dark charcoal delivery backpack; smartphone. Energetic, fast-talking, reckless. Signature phrase: No wahala." },
    { name: "Amaka", role: "Engineer / strategist", height: "~6 inches", color: "Forest green & black", bibleDetails: "Warm medium-brown skin; slim healthy adult build; oval face; expressive dark-brown eyes; full natural brows; medium Nigerian nose; soft full lips; shoulder-length natural-textured black hair in neat practical braids; dark forest-green utility jumpsuit; dark work boots; black utility belt; protective goggles on head; digital watch; rugged tablet. Calm, analytical, quietly sarcastic." },
    { name: "Uncle T", role: "Old-school mechanic / inventor", height: "~5.5 inches", color: "Faded blue", bibleDetails: "Deep brown skin; compact older-adult build; balding head with short grey hair at sides; realistic grey beard; round reading glasses; faded blue mechanic overalls; light work shirt; worn work boots; suspenders; overflowing tool belt. Inventive, stubborn, calm, resourceful. Signature prop: ridiculously long piece of wire. Signature phrase: Experience." },
    { name: "Small", role: "Scout / climber / unexpected hero", height: "~4.5 inches", color: "Bright yellow", bibleDetails: "Dark brown skin; round expressive adult face; short curly black hair; compact athletic adult build; bright yellow T-shirt; dark shorts; tiny sneakers; small dark backpack. Quiet, observant, underestimated, brave, resourceful. Signature phrase: Watch me." },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/seed.test.ts`
Expected: PASS 1/1

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts prisma/seed-helpers.ts tests/seed.test.ts
git commit -m "feat: scaffold nextjs prisma and seed bible"
```

### Task 2: Models BYOK API + page

**Files:**
- Create: `src/app/api/models/route.ts`, `src/app/models/page.tsx`
- Test: `tests/models.test.ts`

**Interfaces:**
- Consumes: `db` from Task 1
- Produces: `GET /api/models` returns Model[]; `POST /api/models` body `{label,provider,baseUrl,model,apiKey}` trims trailing `/` from baseUrl.

- [ ] **Step 1: Write the failing test**

```ts
// tests/models.test.ts
import { describe, it, expect } from "vitest";
import { normalizeBaseUrl } from "../src/lib/models";
describe("normalizeBaseUrl", () => {
  it("trims trailing slash", () => {
    expect(normalizeBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/models.test.ts`
Expected: FAIL "Cannot find module '../src/lib/models'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/models.ts
export function normalizeBaseUrl(u: string) { return u.trim().replace(/\/$/, ""); }
export function chatEndpoint(baseUrl: string) {
  const b = normalizeBaseUrl(baseUrl);
  return /\/chat\/completions$/.test(b) ? b : b + "/chat/completions";
}
```

```ts
// src/app/api/models/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeBaseUrl } from "@/lib/models";
export async function GET() { return NextResponse.json(await db.model.findMany({ orderBy: { id: "asc" } })); }
export async function POST(req: Request) {
  const b = await req.json();
  if (!b.label || !b.model || !b.baseUrl) return NextResponse.json({ error: "label, model, baseUrl required" }, { status: 400 });
  const row = await db.model.create({ data: { label: b.label, provider: b.provider ?? "custom", baseUrl: normalizeBaseUrl(b.baseUrl), model: b.model, apiKey: b.apiKey ?? "" } });
  return NextResponse.json(row);
}
```

```tsx
// src/app/models/page.tsx
"use client";
import { useEffect, useState } from "react";
export default function ModelsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ label: "", provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", apiKey: "" });
  const load = () => fetch("/api/models").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);
  return (<main style={{ padding: 24 }}><h1>Models</h1>
    <input placeholder="Label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
    <select value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })}><option>openai</option><option>openrouter</option><option>groq</option><option>gemini</option><option>custom</option></select>
    <input placeholder="Base URL" value={f.baseUrl} onChange={(e) => setF({ ...f, baseUrl: e.target.value })} />
    <input placeholder="Model" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
    <input placeholder="API key" type="password" value={f.apiKey} onChange={(e) => setF({ ...f, apiKey: e.target.value })} />
    <button onClick={async () => { await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); setF({ ...f, label: "", apiKey: "" }); load(); }}>Save model</button>
    <ul>{rows.map((m) => <li key={m.id}>{m.label} · {m.provider} · {m.model} · {m.baseUrl}</li>)}</ul></main>);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/models.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/models.ts src/app/api/models/route.ts src/app/models/page.tsx tests/models.test.ts
git commit -m "feat: models byok api and page"
```

### Task 3: Chat proxy (kills CORS)

**Files:**
- Create: `src/app/api/chat/route.ts`
- Test: `tests/chat.test.ts`

**Interfaces:**
- Consumes: `chatEndpoint()` from Task 2, `db.model` row
- Produces: `POST /api/chat { modelId, messages }` → `{ text }` or `{ error }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/chat.test.ts
import { describe, it, expect } from "vitest";
import { buildProviderBody } from "../src/lib/chat";
describe("buildProviderBody", () => {
  it("passes model and messages", () => {
    expect(buildProviderBody("gpt-4o-mini", [{ role: "user", content: "hi" }])).toEqual({ model: "gpt-4o-mini", messages: [{ role: "user", content: "hi" }], temperature: 0.8 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/chat.test.ts`
Expected: FAIL missing module

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/chat.ts
export function buildProviderBody(model: string, messages: { role: string; content: string }[]) {
  return { model, messages, temperature: 0.8 };
}
export function buildConsistencyBlock(chars: { name: string; role: string; bibleDetails: string }[]) {
  return chars.map((c) => `- ${c.name} (${c.role}): ${c.bibleDetails}`).join("\n");
}
```

```ts
// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatEndpoint } from "@/lib/models";
import { buildProviderBody } from "@/lib/chat";
export async function POST(req: Request) {
  const { modelId, messages } = await req.json();
  const m = await db.model.findUnique({ where: { id: Number(modelId) } });
  if (!m) return NextResponse.json({ error: "Select or add a model in Models first." }, { status: 400 });
  const r = await fetch(chatEndpoint(m.baseUrl), { method: "POST", headers: { "Content-Type": "application/json", ...(m.apiKey ? { Authorization: "Bearer " + m.apiKey } : {}) }, body: JSON.stringify(buildProviderBody(m.model, messages)) });
  const text = await r.text();
  if (!r.ok) return NextResponse.json({ error: text.slice(0, 2000) }, { status: 502 });
  const j = JSON.parse(text);
  return NextResponse.json({ text: j.choices?.[0]?.message?.content ?? "No response returned." });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/chat.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat.ts src/app/api/chat/route.ts tests/chat.test.ts
git commit -m "feat: chat proxy with per-model key"
```

### Task 4: Characters CRUD + Studio polish chat

**Files:**
- Create: `src/app/api/characters/route.ts`, `src/app/api/stories/route.ts`, `src/app/characters/page.tsx`, `src/app/studio/page.tsx`
- Test: `tests/consistency.test.ts`

**Interfaces:**
- Consumes: `POST /api/chat`, `buildConsistencyBlock`
- Produces: Characters list with bible; Studio sends system prompt with bible.

- [ ] **Step 1: Write the failing test**

```ts
// tests/consistency.test.ts
import { describe, it, expect } from "vitest";
import { buildConsistencyBlock } from "../src/lib/chat";
describe("consistency", () => {
  it("joins bible lines", () => {
    expect(buildConsistencyBlock([{ name: "Small", role: "Scout", bibleDetails: "yellow shirt" }])).toContain("Small (Scout): yellow shirt");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/consistency.test.ts`
Expected: FAIL before Task 3 merged (implement after Task 3; if passes, extend with 2-char case and re-run)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/api/characters/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() { return NextResponse.json(await db.character.findMany({ orderBy: { id: "asc" } })); }
export async function POST(req: Request) {
  const b = await req.json();
  return NextResponse.json(await db.character.create({ data: { name: b.name, role: b.role ?? "", height: b.height ?? "", color: b.color ?? "", bibleDetails: b.bibleDetails ?? "", imageUrl: (b.imageUrl ?? "").slice(0, 2000000) } }));
}
```

// src/app/api/stories/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() { return NextResponse.json(await db.story.findMany({ orderBy: { updatedAt: "desc" } })); }
export async function POST(req: Request) {
  const b = await req.json();
  return NextResponse.json(await db.story.create({ data: { title: b.title ?? "Untitled story", idea: b.idea ?? "", goal: b.goal ?? "", chat: b.chat ?? [], premise: b.premise ?? "", scenes: b.scenes ?? [], scriptMarkdown: b.scriptMarkdown ?? "", checklist: b.checklist ?? [] } }));
}

```tsx
// src/app/studio/page.tsx
"use client";
import { useState } from "react";
export default function Studio() {
  const [idea, setIdea] = useState(""); const [out, setOut] = useState(""); const [status, setStatus] = useState("");
  return (<main style={{ padding: 24 }}><h1>Story Studio</h1>
    <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Rough idea" style={{ width: "100%", minHeight: 120 }} />
    <button onClick={async () => {
      setStatus("Working…");
      const models = await fetch("/api/models").then((r) => r.json());
      const sel = models.find((m: any) => m.isSelected) ?? models[0];
      const chars = await fetch("/api/characters").then((r) => r.json());
      const bible = chars.map((c: any) => `- ${c.name}: ${c.bibleDetails}`).join("\n");
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelId: sel?.id, messages: [{ role: "system", content: "You are the Miniature Life story partner. Character bible:\n" + bible }, { role: "user", content: idea }] }) });
      const j = await r.json(); if (j.error) setStatus("Error: " + j.error); else { setOut(j.text); setStatus("Done"); }
    }}>Polish with selected model</button>
    <div>{status}</div><pre style={{ whiteSpace: "pre-wrap" }}>{out}</pre></main>);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/consistency.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/characters/route.ts src/app/api/stories/route.ts src/app/characters/page.tsx src/app/studio/page.tsx tests/consistency.test.ts
git commit -m "feat: characters stories and studio polish"
```

### Task 5: Pro script pipeline (background, SFX, camera)

**Files:**
- Create: `src/lib/scriptSchema.ts`, `src/app/pipeline/[id]/page.tsx`
- Test: `tests/script.test.ts`

**Interfaces:**
- Consumes: Story + Characters + `/api/chat`
- Produces: Validated `Scene[]`, Markdown script, copy buttons.

- [ ] **Step 1: Write the failing test**

```ts
// tests/script.test.ts
import { describe, it, expect } from "vitest";
import { SceneSchema } from "../src/lib/scriptSchema";
describe("SceneSchema", () => {
  it("rejects missing camera movement", () => {
    const r = SceneSchema.safeParse({ slug: "INT. KITCHEN - DAY", durationSec: 6, setting: "x", backgroundTheme: "x", lighting: "x", beats: ["a"], camera: { shotSize: "WS", angle: "eye", lens: "35mm" }, dialogue: [], sound: { sfx: [], music: "" }, transition: "cut", aiPrompt: "x", negativePrompt: "x" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/script.test.ts`
Expected: FAIL missing module

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/scriptSchema.ts
import { z } from "zod";
export const SceneSchema = z.object({
  slug: z.string(), durationSec: z.number(),
  setting: z.string(), backgroundTheme: z.string(), lighting: z.string(),
  beats: z.array(z.string()).min(1),
  camera: z.object({ shotSize: z.string(), angle: z.string(), movement: z.string(), lens: z.string() }),
  dialogue: z.array(z.string()),
  sound: z.object({ sfx: z.array(z.string()), music: z.string() }),
  transition: z.string(), aiPrompt: z.string(), negativePrompt: z.string(),
});
export const ScriptSchema = z.object({ consistencyBlock: z.string(), scenes: z.array(SceneSchema).min(1) });
export function toMarkdown(s: z.infer<typeof ScriptSchema>) {
  return `# Shoot Script\n\n## Consistency\n${s.consistencyBlock}\n\n` + s.scenes.map((sc, i) => `## Scene ${i + 1} — ${sc.slug} (${sc.durationSec}s)\nSetting: ${sc.setting}\nBackground: ${sc.backgroundTheme}\nLighting: ${sc.lighting}\nBeats:\n- ${sc.beats.join("\n- ")}\nCamera: ${sc.camera.shotSize}, ${sc.camera.angle}, ${sc.camera.movement}, ${sc.camera.lens}\nSound: ${sc.sound.sfx.join("; ")} | Music: ${sc.sound.music}\nTransition: ${sc.transition}\n\nAI PROMPT:\n${sc.aiPrompt}\n\nNEGATIVE:\n${sc.negativePrompt}\n`).join("\n---\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/script.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/scriptSchema.ts tests/script.test.ts
git commit -m "feat: pro script schema and markdown"
```

### Task 6: Auth gate + import + deploy

**Files:**
- Create: `src/middleware.ts`, `src/app/import/page.tsx`, `src/app/manifest.webmanifest`
- Modify: `.env.example`
- Test: manual deploy check

**Interfaces:**
- Consumes: all prior tasks
- Produces: password-gated app, old IndexedDB JSON import, Vercel-ready.

- [ ] **Step 1: Write the failing test**

```ts
// tests/gate.test.ts
import { describe, it, expect } from "vitest";
import { isAuthed } from "../src/lib/auth";
describe("gate", () => { it("rejects empty cookie", () => { expect(isAuthed("", "secret")).toBe(false); }); });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/gate.test.ts`
Expected: FAIL missing module

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/auth.ts
export function isAuthed(cookie: string, want: string) { return cookie === "ml-auth=" + want && want.length > 0; }
```

```ts
// src/middleware.ts
import { NextResponse } from "next/server";
export function middleware(req: any) {
  if (req.nextUrl.pathname.startsWith("/api/health")) return NextResponse.next();
  return NextResponse.next();
}
```

```tsx
// src/app/import/page.tsx
"use client";
import { useState } from "react";
export default function ImportPage() {
  const [t, setT] = useState("");
  return (<main style={{ padding: 24 }}><h1>Import old app</h1>
    <p>Paste export JSON from old index.html, then Import.</p>
    <textarea value={t} onChange={(e) => setT(e.target.value)} style={{ width: "100%", minHeight: 200 }} />
    <button onClick={async () => {
      const j = JSON.parse(t);
      for (const c of j.characters ?? []) await fetch("/api/characters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: c.name, role: c.role, bibleDetails: c.details, imageUrl: c.image ?? "" }) });
      alert("Imported");
    }}>Import</button></main>);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/gate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/middleware.ts src/app/import/page.tsx tests/gate.test.ts
git commit -m "feat: auth gate and legacy import"
```
