// src/app/characters/page.tsx
"use client";
import { useEffect, useState } from "react";
const MAX_IMAGE_CHARS = 2000000;
function readAsDataUrl(file: File) {
  return new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
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
      } catch (e) { rej(e); }
    };
    img.onerror = rej;
    img.src = dataUrl;
  });
}
async function fileToResizedDataUrl(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  let resized: string | null = null;
  try { resized = await resizeImage(raw); } catch { resized = null; }
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
  useEffect(() => { load(); }, []);
  return (<main style={{ padding: 24 }}><h1>Characters</h1>
    <input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
    <input placeholder="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
    <input placeholder="Height" value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} />
    <input placeholder="Color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
    <textarea placeholder="Bible details" value={f.bibleDetails} onChange={(e) => setF({ ...f, bibleDetails: e.target.value })} style={{ width: "100%", minHeight: 80 }} />
    <input placeholder="Image URL (max ~2MB)" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} style={{ width: "100%" }} />
    <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
    <button onClick={async () => {
      try {
        setStatus("Saving…");
        let r: Response;
        if (file) {
          const dataUrl = await fileToResizedDataUrl(file);
          const fd = new FormData();
          fd.append("name", f.name); fd.append("role", f.role); fd.append("height", f.height);
          fd.append("color", f.color); fd.append("bibleDetails", f.bibleDetails);
          fd.append("image", dataUrlToBlob(dataUrl), file.name || "image.jpg");
          r = await fetch("/api/characters", { method: "POST", body: fd });
        } else {
          r = await fetch("/api/characters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        }
        const j = await r.json();
        if (!r.ok) { setStatus("Error: " + (j.error ?? r.status)); return; }
        setF({ name: "", role: "", height: "", color: "", bibleDetails: "", imageUrl: "" }); setFile(null); setStatus("Saved.");
        load();
      } catch (e: any) { setStatus("Error: " + (e?.message ?? e)); }
    }}>Add character</button>
    <div>{status}</div>
    <ul>{rows.map((c) => <li key={c.id}><strong>{c.name}</strong> · {c.role} · {c.height} · {c.color}<br />{c.bibleDetails} <button onClick={async () => { await fetch("/api/characters?id=" + c.id, { method: "DELETE" }); load(); }}>Delete</button></li>)}</ul></main>);
}
