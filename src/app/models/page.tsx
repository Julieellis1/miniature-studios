// src/app/models/page.tsx
"use client";
import { useEffect, useState } from "react";
export default function ModelsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [f, setF] = useState({ label: "", provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", apiKey: "" });
  const load = async () => {
    try {
      setStatus("");
      const r = await fetch("/api/models");
      if (!r.ok) throw new Error("Failed to load models");
      setRows(await r.json());
    } catch (e: any) { setStatus("Error: " + (e?.message ?? e)); }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    try {
      setStatus("");
      const r = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error ?? "Save failed"); }
      setF({ ...f, label: "", apiKey: "" });
      await load();
    } catch (e: any) { setStatus("Error: " + (e?.message ?? e)); }
  };
  const del = async (id: number) => {
    try {
      setStatus("");
      const r = await fetch("/api/models?id=" + id, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      await load();
    } catch (e: any) { setStatus("Error: " + (e?.message ?? e)); }
  };
  const selectDefault = async (id: number) => {
    try {
      setStatus("");
      const r = await fetch("/api/models/select", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!r.ok) throw new Error("Select failed");
      await load();
    } catch (e: any) { setStatus("Error: " + (e?.message ?? e)); }
  };
  return (<main style={{ padding: 24 }}><h1>Models</h1>
    <div>{status}</div>
    <input placeholder="Label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
    <select value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })}><option>openai</option><option>openrouter</option><option>groq</option><option>gemini</option><option>custom</option></select>
    <input placeholder="Base URL" value={f.baseUrl} onChange={(e) => setF({ ...f, baseUrl: e.target.value })} />
    <input placeholder="Model" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
    <input placeholder="API key" type="password" value={f.apiKey} onChange={(e) => setF({ ...f, apiKey: e.target.value })} />
    <button onClick={save}>Save model</button>
    <ul>{rows.map((m) => <li key={m.id}>{m.label} · {m.provider} · {m.model} · {m.baseUrl}{m.isSelected ? " · Selected" : ""} <button onClick={() => del(m.id)}>Delete</button> <button onClick={() => selectDefault(m.id)}>Use as default</button></li>)}</ul></main>);
}
