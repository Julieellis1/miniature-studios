"use client";
import { useState } from "react";
import { validateImportRow } from "@/lib/import";

export default function ImportPage() {
  const [t, setT] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  return (
    <main style={{ padding: 24 }}>
      <h1>Import old app</h1>
      <p>Paste export JSON from old index.html, then Import.</p>
      <textarea
        value={t}
        onChange={(e) => setT(e.target.value)}
        style={{ width: "100%", minHeight: 200 }}
        placeholder='{"characters": [...]}'
      />
      <div>
        <button
          onClick={async () => {
            try {
              setStatus("Importing…");
              setErrors([]);
              const j = JSON.parse(t);
              const chars = j.characters;
              if (!Array.isArray(chars)) {
                setStatus("Error: no characters array found");
                return;
              }
              let n = 0;
              const errs: string[] = [];
              for (let i = 0; i < chars.length; i++) {
                const v = validateImportRow(chars[i], i);
                if (!v.ok) {
                  errs.push(`Row ${v.error.index + 1} (${v.error.name}): skipped — ${v.error.reason}`);
                  continue;
                }
                const r = await fetch("/api/characters", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v.body),
                });
                if (r.ok) {
                  n++;
                } else {
                  const body = await r.json().catch(() => ({}));
                  errs.push(
                    `Row ${i + 1} (${v.body.name}): skipped — ${body.error ?? r.statusText}`
                  );
                }
              }
              setStatus(`Imported ${n}/${chars.length} characters`);
              setErrors(errs);
            } catch (e: any) {
              setStatus("Error: " + (e?.message ?? e));
            }
          }}
        >
          Import
        </button>
      </div>
      <div>{status}</div>
      {errors.length > 0 && (
        <ul>
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
