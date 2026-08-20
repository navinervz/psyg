"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (data.ok) {
        // بارگذاری کامل تا سرور کوکی تازه را ببیند
        window.location.reload();
        return;
      }
      setError(data.message ?? "ورود ناموفق");
    } catch {
      setError("ارتباط برقرار نشد");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-sm place-items-center px-6" dir="rtl">
      <form
        onSubmit={submit}
        className="w-full space-y-4 rounded-2xl border border-line bg-surface p-6"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-accent/15 text-accent">
            <Lock className="size-5" strokeWidth={2.1} />
          </span>
          <h1 className="text-lg font-bold text-hi">پنل مدیریت</h1>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور"
          autoComplete="current-password"
          className="w-full rounded-xl border border-line bg-night px-4 py-3 text-[16px] text-hi outline-none placeholder:text-low focus:border-accent/50"
        />

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={pending || !password}
          className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-night transition-opacity disabled:opacity-40"
        >
          {pending ? "…" : "ورود"}
        </button>
      </form>
    </main>
  );
}
