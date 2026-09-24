// src/app/studio/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { buildConsistencyBlock } from "@/lib/chat";
import { Card, PageHeader, Button, Field, StatusLine } from "@/components/ui";

// Goal options verbatim from old index.html #goal select
const GOALS = [
  "Turn this into a funny TikTok story",
  "Build a cinematic scene-by-scene story",
  "Improve the comedy and pacing",
  "Develop the dialogue",
  "Make the idea more visual for AI video generation",
  "Expand the idea while keeping my original concept",
];

export default function Studio() {
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [chars, setChars] = useState<any[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [out, setOut] = useState("");
  const [status, setStatus] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then((c) => {
        setChars(c);
        setChecked(new Set(c.map((x: any) => x.id)));
      });
  }, []);

  const toggle = (id: number) =>
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <main>
      <PageHeader title="Story Studio" sub="Polish a rough idea with your selected model, then save it as a story." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <Field label="Story title">
            <input
              className="input"
              placeholder="Story title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Rough idea">
            <textarea
              className="input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Rough idea"
              style={{ minHeight: 120 }}
            />
          </Field>
          <Field label="Goal">
            <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Characters
            </span>
            <div className="flex flex-wrap gap-2">
              {chars.map((c) => (
                <label
                  key={c.id}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="accent-fuchsia-400"
                  />
                  {c.name}
                </label>
              ))}
              {chars.length === 0 ? (
                <span className="text-sm text-slate-500">No characters yet.</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={async () => {
                setStatus("Working…");
                const models = await fetch("/api/models").then((r) => r.json());
                const sel = models.find((m: any) => m.isSelected) ?? models[0];
                if (!sel) {
                  setStatus("Error: add a model in Models first.");
                  return;
                }
                const bible = buildConsistencyBlock(chars.filter((c) => checked.has(c.id)));
                const userText = `${title.trim() ? `Story title: ${title.trim()}\n\n` : ""}Here is my rough story idea:\n${idea}\n\nMy goal: ${goal}. First, help me polish the concept. Keep my core idea, explain the improved premise, characters involved, comedic hook, beginning/middle/end, and suggest a short scene-by-scene version. Then ask me what I want to change.`;
                const r = await fetch("/api/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    modelId: sel?.id,
                    messages: [
                      { role: "system", content: "You are the Miniature Life story partner. Character bible:\n" + bible },
                      { role: "user", content: userText },
                    ],
                  }),
                });
                const j = await r.json();
                if (j.error) setStatus("Error: " + j.error);
                else {
                  setOut(j.text);
                  setStatus("Done");
                }
              }}
            >
              Polish with selected model
            </Button>
            {out ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  setStatus("Saving…");
                  const r = await fetch("/api/stories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: title.trim() || "Untitled story",
                      idea,
                      goal,
                      chat: [{ user: idea, assistant: out }],
                      scenes: [],
                      scriptMarkdown: out,
                    }),
                  });
                  const j = await r.json();
                  if (j?.id) {
                    setSavedId(j.id);
                    setStatus("Saved as story #" + j.id);
                  } else {
                    setStatus("Save failed");
                  }
                }}
              >
                Save as story
              </Button>
            ) : null}
          </div>
          <StatusLine text={status} />
          {savedId ? (
            <div className="text-sm text-slate-400">
              <Link href="/stories" className="text-cyan hover:underline">
                View stories
              </Link>{" "}
              <Link href={"/pipeline/" + savedId} className="text-cyan hover:underline">
                Open in pipeline
              </Link>
            </div>
          ) : null}
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Conversation
          </h2>
          {out ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          ) : (
            <p className="text-sm text-slate-500">
              Your polished concept will appear here. Pick characters, set a goal, and hit Polish.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
