"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Field, StatusLine } from "@/components/ui";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  return (
    <main className="mx-auto max-w-md pt-10">
      <Card className="space-y-4 text-center">
        <h1 className="text-2xl font-extrabold text-white">
          Miniature <span className="text-gradient">Life</span> — Login
        </h1>
        <p className="text-sm text-slate-400">Single-user gate. Enter the APP_PASSWORD.</p>
        <div className="text-left">
          <Field label="Password">
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={async () => {
            setStatus("Checking…");
            const r = await fetch("/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });
            if (!r.ok) {
              setStatus("Wrong password");
              return;
            }
            setStatus("OK");
            router.push("/");
          }}
        >
          Unlock
        </Button>
        <StatusLine text={status} />
      </Card>
    </main>
  );
}
