// src/app/models/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, PageHeader, Button, Field, StatusLine, Pill } from "@/components/ui";
import { chatOnce } from "@/lib/chatClient";

export default function ModelsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [testState, setTestState] = useState<Record<number, string>>({});
  const [f, setF] = useState({
    label: "",
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
  });

  const load = async () => {
    try {
      setStatus("");
      const r = await fetch("/api/models");
      if (!r.ok) throw new Error("Failed to load models");
      setRows(await r.json());
    } catch (e: any) {
      setStatus("Error: " + (e?.message ?? e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      setStatus("");
      const r = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Save failed");
      }
      setF({ ...f, label: "", apiKey: "" });
      await load();
    } catch (e: any) {
      setStatus("Error: " + (e?.message ?? e));
    }
  };

  const del = async (id: number) => {
    try {
      setStatus("");
      const r = await fetch("/api/models?id=" + id, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      await load();
    } catch (e: any) {
      setStatus("Error: " + (e?.message ?? e));
    }
  };

  const selectDefault = async (id: number) => {
    try {
      setStatus("");
      const r = await fetch("/api/models/select", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) throw new Error("Select failed");
      await load();
    } catch (e: any) {
      setStatus("Error: " + (e?.message ?? e));
    }
  };

  const testModel = async (id: number) => {
    setTestState((p) => ({ ...p, [id]: "Testing…" }));
    const t0 = Date.now();
    try {
      const text = await chatOnce(
        id,
        [{ role: "user", content: "Reply with exactly: OK" }],
        { timeoutMs: 30000, maxTokens: 16 }
      );
      const ms = ((Date.now() - t0) / 1000).toFixed(1);
      setTestState((p) => ({ ...p, [id]: `✓ OK (${ms}s) — "${text.slice(0, 60)}"` }));
    } catch (e: any) {
      setTestState((p) => ({ ...p, [id]: "✗ " + (e?.message ?? e) }));
    }
  };

  return (
    <main>
      <PageHeader title="Models" sub="Bring your own keys. Pick a provider and choose the default model." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3">
          <h2 className="font-bold text-white">Add model (BYOK)</h2>
          <Field label="Label">
            <input className="input" placeholder="Label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
          </Field>
          <Field label="Provider">
            <select className="input" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })}>
              <option>openai</option>
              <option>openrouter</option>
              <option>groq</option>
              <option>gemini</option>
              <option>custom</option>
            </select>
          </Field>
          <Field label="Base URL">
            <input className="input" placeholder="Base URL" value={f.baseUrl} onChange={(e) => setF({ ...f, baseUrl: e.target.value })} />
          </Field>
          <Field label="Model">
            <input className="input" placeholder="Model" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
          </Field>
          <Field label="API key">
            <input
              className="input"
              placeholder="API key"
              type="password"
              value={f.apiKey}
              onChange={(e) => setF({ ...f, apiKey: e.target.value })}
            />
          </Field>
          <Button variant="primary" onClick={save}>
            Save model
          </Button>
          <StatusLine text={status} />
        </Card>
        <div className="space-y-3 lg:col-span-2">
          {rows.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white">{m.label}</span>
                  {m.isSelected ? (
                    <span className="rounded-full bg-gradient-to-r from-gold via-magenta to-cyan px-2.5 py-0.5 text-xs font-bold text-ink">
                      Selected
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-400">
                  <Pill>{m.provider}</Pill>
                  <Pill>{m.model}</Pill>
                  <Pill>{m.baseUrl}</Pill>
                </div>
                {testState[m.id] ? (
                  <div className="mt-1.5 text-xs text-slate-300">{testState[m.id]}</div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => testModel(m.id)}>
                  Test
                </Button>
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => selectDefault(m.id)}>
                  Use as default
                </Button>
                <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => del(m.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
          {rows.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">No models yet. Add one to start generating.</p>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
