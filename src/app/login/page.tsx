// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClients";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErr(error.message);
    } else {
      router.push("/dashboard"); // завжди веде на dashboard
    }
  }

  async function loginGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/dashboard` },
    });
    if (error) setErr(error.message);
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Zaloguj się 🎁</h1>

        {err && <p className="text-red-500 text-sm mb-4 text-center">{err}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 rounded border"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-2 rounded border"
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="w-full py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <button
          onClick={loginGoogle}
          className="mt-4 w-full py-2 rounded bg-red-500 text-white"
        >
          Google
        </button>

        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
          Nie masz konta?{" "}
          <Link href="/register" className="text-blue-600 underline">
            Rejestracja
          </Link>
        </p>
      </div>
    </main>
  );
}
