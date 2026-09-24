"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();
  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Miniature Life — Login</h1>
      <p>Single-user gate. Enter the APP_PASSWORD.</p>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button
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
      </button>
      <div>{status}</div>
    </main>
  );
}
