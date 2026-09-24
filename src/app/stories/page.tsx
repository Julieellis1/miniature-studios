// src/app/stories/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, Button, Field, EmptyState } from "@/components/ui";

export default function StoriesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const load = () => fetch("/api/stories").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);

  return (
    <main>
      <PageHeader title="Stories" sub="Create a story shell or open one in the pro-script pipeline." />
      <Card className="mb-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/stories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: title.trim() || "Untitled story", idea }),
            });
            setTitle("");
            setIdea("");
            load();
          }}
          className="space-y-3"
        >
          <Field label="New story title">
            <input
              className="input"
              placeholder="New story title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Rough idea">
            <textarea
              className="input"
              placeholder="Rough idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              style={{ minHeight: 60 }}
            />
          </Field>
          <Button type="submit" variant="primary">
            Create story
          </Button>
        </form>
      </Card>
      {rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((s) => (
            <Card key={s.id} className="flex flex-col gap-2">
              <h3 className="font-bold text-white">{s.title || "Untitled"}</h3>
              <p className="flex-1 text-sm text-slate-400">
                {(s.idea || "").slice(0, 220)}
                {s.idea && s.idea.length > 220 ? "…" : ""}
              </p>
              <div className="flex gap-2">
                <Link href={"/pipeline/" + s.id}>
                  <Button variant="primary" className="px-3 py-1.5 text-xs">
                    Open
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={async () => {
                    await fetch("/api/stories?id=" + s.id, { method: "DELETE" });
                    load();
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No saved stories yet." hint="Create one above or polish an idea in Story Studio." />
      )}
    </main>
  );
}
