// app/register/page.tsx
"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Допоміжна мапа помилок Supabase → дружні повідомлення
function humanizeError(message?: string) {
  if (!message) return "Wystąpił błąd. Spróbuj ponownie.";
  const m = message.toLowerCase();
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "Ten e-mail jest już zarejestrowany. Zaloguj się lub użyj innego adresu.";
  }
  if (m.includes("invalid email")) return "Nieprawidłowy adres e-mail.";
  if (m.includes("password")) return "Hasło jest za słabe lub nie spełnia wymagań.";
  return message; // fallback
}

export default function RegisterPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agree, setAgree] = useState(false);

  // UI state
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirectTimerRef = useRef<number | null>(null);

  // Абсолютна URL для підтвердження e-mail (напр. /auth/callback)
  const emailRedirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/auth/callback`;
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6; // за потреби посиліть вимоги
  const passwordsMatch = password === confirm;
  const canSubmit = isEmailValid && isPasswordValid && passwordsMatch && agree && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!canSubmit) return;

    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo, // дуже важливо для листа підтвердження
        // metadata: { locale: "pl" } // опційно
      },
    });
    setLoading(false);

    if (error) {
      setErr(humanizeError(error.message));
      return;
    }

    // Якщо увімкнено confirm e-mail → session === null, треба чекнути skrzynkę
    if (!data.session) {
      setMsg("Sprawdź skrzynkę i potwierdź rejestrację 📧");
      // За бажанням – автоперехід на /login за кілька секунд:
      redirectTimerRef.current = window.setTimeout(() => router.push("/login"), 3500);
      return;
    }

    // Якщо підтвердження вимкнено і сесія є — ведемо користувача далі
    setMsg("Rejestracja udana! Przekierowuję…");
    router.push("/dashboard");
  }

  async function signUpWithGoogle() {
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: emailRedirectTo },
    });
    setLoading(false);
    if (error) setErr(humanizeError(error.message));
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Rejestracja ✨</h1>

        {err && (
          <p className="text-red-500 text-sm mb-3 text-center" role="alert" aria-live="assertive">
            {err}
          </p>
        )}
        {msg && (
          <p className="text-green-600 text-sm mb-3 text-center" aria-live="polite">
            {msg}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-900"
              type="email"
              placeholder="nazwa@domena.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              aria-invalid={!!email && !isEmailValid}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium">
              Hasło (min. 6 znaków)
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-900 pr-12"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                aria-invalid={!!password && !isPasswordValid}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={showPwd ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showPwd ? "Ukryj" : "Pokaż"}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm" className="block text-sm font-medium">
              Potwierdź hasło
            </label>
            <input
              id="confirm"
              name="confirm"
              className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-900"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              aria-invalid={!!confirm && !passwordsMatch}
            />
            {!!confirm && !passwordsMatch && (
              <p className="text-xs text-red-500">Hasła nie są takie same.</p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              required
            />
            <span>
              Akceptuję{" "}
              <Link href="/regulamin" className="text-blue-600 underline" target="_blank">
                Regulamin
              </Link>{" "}
              i{" "}
              <Link href="/polityka-prywatnosci" className="text-blue-600 underline" target="_blank">
                Politykę prywatności
              </Link>
              .
            </span>
          </label>

          <button
            disabled={!canSubmit}
            className="w-full py-2 rounded bg-green-600 text-white font-semibold disabled:opacity-60"
            type="submit"
          >
            {loading ? "Rejestracja..." : "Zarejestruj się"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={signUpWithGoogle}
            disabled={loading}
            className="w-full py-2 rounded border font-medium disabled:opacity-60"
            type="button"
          >
            {loading ? "Trwa łączenie…" : "Zarejestruj się przez Google"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Masz konto?{" "}
          <Link href="/login" className="text-blue-600 underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </main>
  );
}
