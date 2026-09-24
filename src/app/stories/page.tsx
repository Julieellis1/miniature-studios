// src/app/stories/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function StoriesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const load = () => fetch("/api/stories").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);
  return (<main style={{ padding: 24 }}><h1>Stories</h1>
    <form onSubmit={async (e) => { e.preventDefault(); await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim() || "Untitled story", idea }) }); setTitle(""); setIdea(""); load(); }} style={{ marginBottom: 16 }}>
      <input placeholder="New story title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
      <textarea placeholder="Rough idea" value={idea} onChange={(e) => setIdea(e.target.value)} style={{ width: "100%", minHeight: 60, marginBottom: 8 }} />
      <button type="submit">Create story</button>
    </form>
    {rows.length ? (<ul>{rows.map((s) => <li key={s.id}><strong>{s.title || "Untitled"}</strong>
      <p>{(s.idea || "").slice(0, 220)}{s.idea && s.idea.length > 220 ? "…" : ""}</p>
      <Link href={"/pipeline/" + s.id}>Open</Link>{" "}
      <button onClick={async () => { await fetch("/api/stories?id=" + s.id, { method: "DELETE" }); load(); }}>Delete</button></li>)}</ul>)
      : (<p>No saved stories yet.</p>)}</main>);
}
