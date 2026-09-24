// src/app/characters/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, PageHeader, Button, Field, EmptyState, StatusLine, Pill } from "@/components/ui";

const MAX_IMAGE_CHARS = 2000000;

function readAsDataUrl(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function resizeImage(dataUrl: string) {
  return new Promise<string>((res, rej) => {
    const img = new Image();
    img.onload = () => {
      try {
        const max = 1024;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        res(canvas.toDataURL("image/jpeg", 0.85));
      } catch (e) {
        rej(e);
      }
    };
    img.onerror = rej;
    img.src = dataUrl;
  });
}

async function fileToResizedDataUrl(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  let resized: string | null = null;
  try {
    resized = await resizeImage(raw);
  } catch {
    resized = null;
  }
  const out = resized ?? raw;
  if (out.length > MAX_IMAGE_CHARS) throw new Error("Image too large, max ~2MB");
  return out;
}

function dataUrlToBlob(dataUrl: string) {
  const [head, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function CharactersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ name: "", role: "", height: "", color: "", bibleDetails: "", imageUrl: "" });
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const load = () => fetch("/api/characters").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);

  return (
    <main>
      <PageHeader title="Characters" sub="Your miniature cast, bible details, and reference images." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-1">
          <h2 className="font-bold text-white">Add character</h2>
          <Field label="Name">
            <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="Role">
            <input className="input" placeholder="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height">
              <input className="input" placeholder="Height" value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} />
            </Field>
            <Field label="Color">
              <input className="input" placeholder="Color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
            </Field>
          </div>
          <Field label="Bible details">
            <textarea
              className="input"
              placeholder="Bible details"
              value={f.bibleDetails}
              onChange={(e) => setF({ ...f, bibleDetails: e.target.value })}
              style={{ minHeight: 80 }}
            />
          </Field>
          <Field label="Image URL">
            <input
              className="input"
              placeholder="Image URL (max ~2MB)"
              value={f.imageUrl}
              onChange={(e) => setF({ ...f, imageUrl: e.target.value })}
            />
          </Field>
          <Field label="Upload image">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-400"
            />
          </Field>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                setStatus("Saving…");
                let r: Response;
                if (file) {
                  const dataUrl = await fileToResizedDataUrl(file);
                  const fd = new FormData();
                  fd.append("name", f.name);
                  fd.append("role", f.role);
                  fd.append("height", f.height);
                  fd.append("color", f.color);
                  fd.append("bibleDetails", f.bibleDetails);
                  fd.append("image", dataUrlToBlob(dataUrl), file.name || "image.jpg");
                  r = await fetch("/api/characters", { method: "POST", body: fd });
                } else {
                  r = await fetch("/api/characters", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(f),
                  });
                }
                const j = await r.json();
                if (!r.ok) {
                  setStatus("Error: " + (j.error ?? r.status));
                  return;
                }
                setF({ name: "", role: "", height: "", color: "", bibleDetails: "", imageUrl: "" });
                setFile(null);
                setStatus("Saved.");
                load();
              } catch (e: any) {
                setStatus("Error: " + (e?.message ?? e));
              }
            }}
          >
            Add character
          </Button>
          <StatusLine text={status} />
        </Card>
        <div className="lg:col-span-2">
          {rows.length === 0 ? (
            <EmptyState title="No characters yet" hint="Add your first miniature above." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((c) => (
                <Card key={c.id} className="space-y-2 overflow-hidden p-0">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} className="h-40 w-full object-cover" />
                  ) : null}
                  <div className="space-y-2 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white">{c.name}</h3>
                      <Button
                        variant="danger"
                        className="px-3 py-1 text-xs"
                        onClick={async () => {
                          await fetch("/api/characters?id=" + c.id, { method: "DELETE" });
                          load();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.role ? <Pill>{c.role}</Pill> : null}
                      {c.height ? <Pill>{c.height}</Pill> : null}
                      {c.color ? <Pill>{c.color}</Pill> : null}
                    </div>
                    {c.bibleDetails ? (
                      <p className="text-sm text-slate-400">{c.bibleDetails}</p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
