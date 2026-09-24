// src/app/pipeline/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { buildConsistencyBlock } from "@/lib/chat";
import { ScriptSchema, toMarkdown, type ProScript } from "@/lib/scriptSchema";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

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
    fetch("/api/stories").then((r) => r.json()).then((rows: any[]) => {
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
    fetch("/api/models").then((r) => r.json()).then((m: any[]) => {
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
    if (!modelId) { setStatus("Error: add/select a model in Models first."); return; }
    const bible = buildConsistencyBlock(chars);
    const system = `You are the Miniature Life pro-script writer. Return STRICT JSON only (no markdown fences, no commentary) with shape {"consistencyBlock": string, "scenes": Scene[${sceneCount}]} where each Scene = {"slug": string (e.g. "INT. GIANT KITCHEN - DAY"), "durationSec": number, "setting": string, "backgroundTheme": string (setting + set dressing + scale gags with giant objects), "lighting": string, "beats": string[3-5 visual, filmable beats], "camera": {"shotSize": string (ECU/CU/MS/WS), "angle": string (eye-level/low/high/dutch), "movement": string (static/push-in/dolly-in/crane-down/handheld-pan/tracking), "lens": string (24/35/50mm)}, "dialogue": string[] (character voice + pidgin where fitting), "sound": {"sfx": string[] (with timestamps), "music": string}, "transition": string, "aiPrompt": string (single copy-ready paragraph for Veo/Kling/Runway/Pika: characters + scale + setting + lighting + camera movement + action + mood), "negativePrompt": string}. Every scene MUST include camera.shotSize, camera.angle, camera.movement, camera.lens and sound.sfx + sound.music. Prepend character consistency from the bible into consistencyBlock.`;
    const user = `Character bible:\n${bible}\n\nStory: ${story?.title ?? "Untitled"}\nIdea: ${story?.idea ?? ""}\nPremise: ${story?.premise ?? ""}\nGoal: ${story?.goal ?? ""}\nWrite exactly ${sceneCount} scenes. Total runtime 15-35s, hook in first 2s.`;
    const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelId: Number(modelId), messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
    const j = await r.json();
    if (j.error) { setStatus("Error: " + j.error); return; }
    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(j.text));
    } catch {
      setStatus("Error: model did not return valid JSON. Raw output kept below.");
      setMarkdown(j.text);
      return;
    }
    const v = ScriptSchema.safeParse(parsed);
    if (!v.success) { setStatus("Error: script failed validation: " + v.error.message); return; }
    const md = toMarkdown(v.data);
    setScript(v.data);
    setMarkdown(md);
    await fetch("/api/stories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: storyId, scenes: v.data.scenes, scriptMarkdown: md }) });
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

  return (<main style={{ padding: 24, maxWidth: 900 }}>
    <h1>Pro Script Pipeline — Story #{params.id}</h1>
    {story && <p><strong>{story.title}</strong> · {(story.idea || "").slice(0, 200)}</p>}
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
      <label>Model: <select value={modelId} onChange={(e) => setModelId(e.target.value)}>
        {models.map((m) => <option key={m.id} value={m.id}>{m.label} · {m.model}</option>)}
      </select></label>
      <label>Scenes: <input type="number" min={1} max={10} value={sceneCount} onChange={(e) => setSceneCount(Number(e.target.value))} style={{ width: 60 }} /></label>
      <button onClick={generate}>Generate Pro Script</button>
    </div>
    <div>{status}</div>
    {markdown && (<div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => copy(markdown)}>Copy all</button>
        <button onClick={download}>Download .md</button>
      </div>
      {script && script.scenes.map((sc, i) => (<section key={i} style={{ border: "1px solid #ccc", padding: 12, marginTop: 12 }}>
        <h3>Scene {i + 1} — {sc.slug} ({sc.durationSec}s)</h3>
        <p>Setting: {sc.setting}<br />Background: {sc.backgroundTheme}<br />Lighting: {sc.lighting}<br />Camera: {sc.camera.shotSize}, {sc.camera.angle}, {sc.camera.movement}, {sc.camera.lens}<br />Sound: {sc.sound.sfx.join("; ")} | Music: {sc.sound.music}<br />Transition: {sc.transition}</p>
        <h4>Beats</h4>
        <ul>{sc.beats.map((b, j) => <li key={j}>{b}</li>)}</ul>
        <h4>Dialogue</h4>
        {sc.dialogue.length ? (<ul>{sc.dialogue.map((d, j) => <li key={j}>{d}</li>)}</ul>) : (<p>(none)</p>)}
        <h4>AI prompt</h4>
        <p style={{ whiteSpace: "pre-wrap" }}>{sc.aiPrompt}</p>
        <button onClick={() => copy(sc.aiPrompt)}>Copy AI prompt</button>
      </section>))}
      <h2>Full Markdown</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{markdown}</pre>
    </div>)}
  </main>);
}
