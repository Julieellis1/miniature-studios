// src/app/pipeline/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { buildConsistencyBlock } from "@/lib/chat";
import { chatOnce } from "@/lib/chatClient";
import { ScriptSchema, toMarkdown, type ProScript } from "@/lib/scriptSchema";
import { Card, PageHeader, Button, Field, StatusLine } from "@/components/ui";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

const STEPS = ["Idea", "Pro Script", "Shoot"];

export default function PipelinePage({ params }: { params: { id: string } }) {
  const storyId = Number(params.id);
  const [story, setStory] = useState<any>(null);
  const [chars, setChars] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [modelId, setModelId] = useState<string>("");
  const [sceneCount, setSceneCount] = useState(3);
  const [status, setStatus] = useState("");
  const [script, setScript] = useState<ProScript | null>(null);
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((rows: any[]) => {
        const s = rows.find((x) => x.id === storyId);
        if (s) {
          setStory(s);
          if (s.scriptMarkdown) setMarkdown(s.scriptMarkdown);
          if (Array.isArray(s.scenes) && s.scenes.length) {
            const parsed = ScriptSchema.safeParse({ consistencyBlock: "", scenes: s.scenes });
            if (parsed.success) setScript(parsed.data);
          }
        } else setStatus("Story not found.");
      });
    fetch("/api/characters").then((r) => r.json()).then(setChars);
    fetch("/api/models")
      .then((r) => r.json())
      .then((m: any[]) => {
        setModels(m);
        const sel = m.find((x) => x.isSelected) ?? m[0];
        if (sel) setModelId(String(sel.id));
      });
  }, [storyId]);

  const copy = async (t: string) => {
    await navigator.clipboard.writeText(t);
    setStatus("Copied to clipboard.");
  };

  const generate = async () => {
    setStatus("Generating pro script…");
    setScript(null);
    if (!modelId) {
      setStatus("Error: add/select a model in Models first.");
      return;
    }
    const bible = buildConsistencyBlock(chars);
    const system = `You are the Miniature Life pro-script writer. Return STRICT JSON only (no markdown fences, no commentary) with shape {"consistencyBlock": string, "scenes": Scene[${sceneCount}]} where each Scene = {"slug": string (e.g. "INT. GIANT KITCHEN - DAY"), "durationSec": number, "setting": string, "backgroundTheme": string (setting + set dressing + scale gags with giant objects), "lighting": string, "beats": string[3-5 visual, filmable beats], "camera": {"shotSize": string (ECU/CU/MS/WS), "angle": string (eye-level/low/high/dutch), "movement": string (static/push-in/dolly-in/crane-down/handheld-pan/tracking), "lens": string (24/35/50mm)}, "dialogue": string[] (character voice + pidgin where fitting), "sound": {"sfx": string[] (with timestamps), "music": string}, "transition": string, "aiPrompt": string (single copy-ready paragraph for Veo/Kling/Runway/Pika: characters + scale + setting + lighting + camera movement + action + mood), "negativePrompt": string}. Every scene MUST include camera.shotSize, camera.angle, camera.movement, camera.lens and sound.sfx + sound.music. Prepend character consistency from the bible into consistencyBlock.`;
    const user = `Character bible:\n${bible}\n\nStory: ${story?.title ?? "Untitled"}\nIdea: ${story?.idea ?? ""}\nPremise: ${story?.premise ?? ""}\nGoal: ${story?.goal ?? ""}\nWrite exactly ${sceneCount} scenes. Total runtime 15-35s, hook in first 2s.`;
    let text: string;
    try {
      text = await chatOnce(Number(modelId), [
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
    } catch (e: any) {
      setStatus("Error: " + (e?.message ?? e) + " If this persists, Test the model in Models.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(text));
    } catch {
      setStatus("Error: model did not return valid JSON. Raw output kept below.");
      setMarkdown(text);
      return;
    }
    const v = ScriptSchema.safeParse(parsed);
    if (!v.success) {
      setStatus("Error: script failed validation: " + v.error.message);
      return;
    }
    const md = toMarkdown(v.data);
    setScript(v.data);
    setMarkdown(md);
    await fetch("/api/stories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: storyId, scenes: v.data.scenes, scriptMarkdown: md }),
    });
    setStory((s: any) => (s ? { ...s, scenes: v.data.scenes, scriptMarkdown: md } : s));
    setStatus("Done — pro script saved.");
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shoot-script-${storyId}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeStep = script ? 2 : story ? 1 : 0;

  return (
    <main>
      <PageHeader
        title={`Pro Script Pipeline — Story #${params.id}`}
        sub={story ? `${story.title} · ${(story.idea || "").slice(0, 200)}` : undefined}
      />
      <div className="mb-4 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                i <= activeStep
                  ? "bg-gradient-to-r from-gold via-magenta to-cyan text-ink"
                  : "border border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {i + 1}. {s}
            </span>
            {i < STEPS.length - 1 ? <span className="text-slate-600">→</span> : null}
          </div>
        ))}
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Model">
            <select className="input min-w-52" value={modelId} onChange={(e) => setModelId(e.target.value)}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} · {m.model}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Scenes">
            <input
              className="input"
              type="number"
              min={1}
              max={10}
              value={sceneCount}
              onChange={(e) => setSceneCount(Number(e.target.value))}
              style={{ width: 80 }}
            />
          </Field>
          <Button variant="primary" onClick={generate}>
            Generate Pro Script
          </Button>
        </div>
        <div className="mt-3">
          <StatusLine text={status} />
        </div>
      </Card>

      {markdown && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => copy(markdown)}>
              Copy all
            </Button>
            <Button variant="ghost" onClick={download}>
              Download .md
            </Button>
          </div>
          {script &&
            script.scenes.map((sc, i) => (
              <Card key={i}>
                <h3 className="font-bold text-white">
                  Scene {i + 1} — {sc.slug} ({sc.durationSec}s)
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Setting: {sc.setting}
                  <br />
                  Background: {sc.backgroundTheme}
                  <br />
                  Lighting: {sc.lighting}
                  <br />
                  Camera: {sc.camera.shotSize}, {sc.camera.angle}, {sc.camera.movement}, {sc.camera.lens}
                  <br />
                  Sound: {sc.sound.sfx.join("; ")} | Music: {sc.sound.music}
                  <br />
                  Transition: {sc.transition}
                </p>
                <h4 className="mt-3 text-sm font-bold uppercase tracking-wider text-gold">Beats</h4>
                <ul className="list-disc pl-5 text-sm text-slate-200">
                  {sc.beats.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
                <h4 className="mt-3 text-sm font-bold uppercase tracking-wider text-magenta">Dialogue</h4>
                {sc.dialogue.length ? (
                  <ul className="list-disc pl-5 text-sm text-slate-200">
                    {sc.dialogue.map((d, j) => (
                      <li key={j}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">(none)</p>
                )}
                <h4 className="mt-3 text-sm font-bold uppercase tracking-wider text-cyan">AI prompt</h4>
                <p className="whitespace-pre-wrap text-sm text-slate-200">{sc.aiPrompt}</p>
                <div className="mt-2">
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => copy(sc.aiPrompt)}>
                    Copy AI prompt
                  </Button>
                </div>
              </Card>
            ))}
          <Card>
            <h2 className="mb-2 font-bold text-white">Full Markdown</h2>
            <pre className="whitespace-pre-wrap text-sm text-slate-300">{markdown}</pre>
          </Card>
        </div>
      )}
    </main>
  );
}
