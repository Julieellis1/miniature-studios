"use client";
import { useState } from "react";
import { validateImportRow } from "@/lib/import";
import { Card, PageHeader, Button, Field, StatusLine } from "@/components/ui";

export default function ImportPage() {
  const [t, setT] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <main>
      <PageHeader title="Import old app" sub="Paste export JSON from old index.html, then Import." />
      <Card className="space-y-3">
        <Field label="Export JSON">
          <textarea
            className="input font-mono text-xs"
            value={t}
            onChange={(e) => setT(e.target.value)}
            style={{ minHeight: 200 }}
            placeholder='{"characters": [...]}'
          />
        </Field>
        <Button
          variant="primary"
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
                  errs.push(`Row ${i + 1} (${v.body.name}): skipped — ${body.error ?? r.statusText}`);
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
        </Button>
        <StatusLine text={status} />
        {errors.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-300">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
