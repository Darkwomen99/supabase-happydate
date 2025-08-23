// /src/js/supabaseClient.js — HappyDate
import { createClient } from "@supabase/supabase-js";

// ─── Збір ENV ─────────────────────────────────────────────
let SUPABASE_URL = "";
let SUPABASE_ANON_KEY = "";

// 1) Найперше: беремо із process.env (Next.js на Vercel)
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// 2) Якщо це браузер і є window.ENV (з /public/env.js)
else if (typeof window !== "undefined" && window.ENV) {
  SUPABASE_URL = window.ENV.SUPABASE_URL;
  SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY;
}

// 3) Якщо є локальний файл src/api/env.js (fallback для dev)
else {
  try {
    const localEnv = (await import("../api/env.js")).default;
    SUPABASE_URL = localEnv.SUPABASE_URL;
    SUPABASE_ANON_KEY = localEnv.SUPABASE_ANON_KEY;
  } catch {
    console.warn("[supabaseClient] env.js not found, fallback skipped");
  }
}

// Перевірка
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[supabaseClient] ❌ Missing SUPABASE_URL / SUPABASE_ANON_KEY");
}

// ─── Створюємо клієнт ─────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
