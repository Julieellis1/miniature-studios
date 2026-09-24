// src/app/studio/page.tsx
"use client";
import { useEffect, useState } from "react";
import { buildConsistencyBlock } from "@/lib/chat";
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
  const [idea, setIdea] = useState(""); const [goal, setGoal] = useState(GOALS[0]);
  const [chars, setChars] = useState<any[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [out, setOut] = useState(""); const [status, setStatus] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/characters").then((r) => r.json()).then((c) => { setChars(c); setChecked(new Set(c.map((x: any) => x.id))); });
  }, []);
  const toggle = (id: number) => setChecked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (<main style={{ padding: 24 }}><h1>Story Studio</h1>
    <input placeholder="Story title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} />
    <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Rough idea" style={{ width: "100%", minHeight: 120 }} />
    <select value={goal} onChange={(e) => setGoal(e.target.value)}>{GOALS.map((g) => <option key={g}>{g}</option>)}</select>
    <div>{chars.map((c) => <label key={c.id} style={{ display: "inline-block", marginRight: 14 }}><input type="checkbox" checked={checked.has(c.id)} onChange={() => toggle(c.id)} style={{ width: "auto" }} /> {c.name}</label>)}</div>
    <button onClick={async () => {
      setStatus("Working…");
      const models = await fetch("/api/models").then((r) => r.json());
      const sel = models.find((m: any) => m.isSelected) ?? models[0];
      if (!sel) { setStatus("Error: add a model in Models first."); return; }
      const bible = buildConsistencyBlock(chars.filter((c) => checked.has(c.id)));
      const userText = `${title.trim() ? `Story title: ${title.trim()}\n\n` : ""}Here is my rough story idea:\n${idea}\n\nMy goal: ${goal}. First, help me polish the concept. Keep my core idea, explain the improved premise, characters involved, comedic hook, beginning/middle/end, and suggest a short scene-by-scene version. Then ask me what I want to change.`;
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelId: sel?.id, messages: [{ role: "system", content: "You are the Miniature Life story partner. Character bible:\n" + bible }, { role: "user", content: userText }] }) });
      const j = await r.json(); if (j.error) setStatus("Error: " + j.error); else { setOut(j.text); setStatus("Done"); }
    }}>Polish with selected model</button>
     <div>{status}</div><pre style={{ whiteSpace: "pre-wrap" }}>{out}</pre>
     {out ? (<div style={{ marginTop: 12 }}>
       <button onClick={async () => {
         setStatus("Saving…");
         const r = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim() || "Untitled story", idea, goal, chat: [{ user: idea, assistant: out }], scenes: [], scriptMarkdown: out }) });
         const j = await r.json();
         if (j?.id) { setSavedId(j.id); setStatus("Saved as story #" + j.id); } else { setStatus("Save failed"); }
       }}>Save as story</button>
       {savedId ? (<span style={{ marginLeft: 8 }}><a href="/stories">View stories</a>{" "}<a href={"/pipeline/" + savedId}>Open in pipeline</a></span>) : null}
     </div>) : null}</main>);
}
