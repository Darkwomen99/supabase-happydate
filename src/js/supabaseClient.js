// /src/js/supabaseClient.js — HappyDate (production-ready, static hosting friendly)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ПРІОРИТЕТИ джерел ENV:
 * 1) window.ENV.{SUPABASE_URL,SUPABASE_ANON_KEY}  ← /public/env.js
 * 2) window.env.{...}                              ← legacy
 * 3) <meta name="supabase-url" content="...">      ← опціонально у <head>
 *    <meta name="supabase-anon-key" content="...">
 * 4) window.SUPABASE_URL / window.SUPABASE_ANON_KEY← глобальні змінні
 * 5) /api/env (Vercel Edge/Serverless)             ← JSON з NEXT_PUBLIC_*
 */
let envPromise = null;

/* ───────────────────────────── utils ───────────────────────────── */
const isLocalhost = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);

function readMeta(name) {
  try { return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || null; }
  catch { return null; }
}

// Безпечний storage (fallback на in-memory, якщо localStorage заборонений)
const safeStorage = (() => {
  try {
    const k = "__hd_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
  }
})();

async function fetchEnvFromApi(retries = 2) {
  const url = "/api/env";
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (res.ok) return await res.json();
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  return null;
}

function normalizeEnv(json) {
  if (!json) return {};
  return {
    SUPABASE_URL: json.SUPABASE_URL || json.NEXT_PUBLIC_SUPABASE_URL || json.url || null,
    SUPABASE_ANON_KEY: json.SUPABASE_ANON_KEY || json.NEXT_PUBLIC_SUPABASE_ANON_KEY || json.anon || null,
  };
}

function must(val, name) {
  if (!val) {
    const msg = `[Supabase] Missing ${name}. Додай ключі у /public/env.js (window.ENV) або налаштуй NEXT_PUBLIC_* у Vercel / /api/env.`;
    console.error(msg);
    if (typeof window !== "undefined" && isLocalhost) {
      try { alert(msg); } catch {}
    }
    throw new Error(msg);
  }
  return val;
}

/* ───────────────────────────── ENV loader ───────────────────────────── */
async function getEnv() {
  // 1) window.ENV
  if (globalThis.window?.ENV?.SUPABASE_URL && globalThis.window?.ENV?.SUPABASE_ANON_KEY) {
    return globalThis.window.ENV;
  }
  // 2) window.env (legacy)
  if (globalThis.window?.env?.SUPABASE_URL && globalThis.window?.env?.SUPABASE_ANON_KEY) {
    return globalThis.window.env;
  }
  // 3) META tags (optional)
  const metaUrl = readMeta("supabase-url");
  const metaKey = readMeta("supabase-anon-key");
  if (metaUrl && metaKey) {
    globalThis.window = globalThis.window || {};
    globalThis.window.ENV = Object.assign({}, globalThis.window.ENV, {
      SUPABASE_URL: metaUrl,
      SUPABASE_ANON_KEY: metaKey,
    });
    return globalThis.window.ENV;
  }
  // 4) Глобальні змінні
  if (globalThis.window?.SUPABASE_URL && globalThis.window?.SUPABASE_ANON_KEY) {
    return {
      SUPABASE_URL: globalThis.window.SUPABASE_URL,
      SUPABASE_ANON_KEY: globalThis.window.SUPABASE_ANON_KEY,
    };
  }
  // 5) /api/env — кешуємо в envPromise
  if (!envPromise) {
    envPromise = (async () => {
      const json = normalizeEnv(await fetchEnvFromApi());
      if (json.SUPABASE_URL && json.SUPABASE_ANON_KEY) {
        globalThis.window = globalThis.window || {};
        globalThis.window.ENV = Object.assign({}, globalThis.window.ENV, json);
      }
      // повертаємо що є в window після нормалізації (або пустий об’єкт)
      return globalThis.window?.ENV || globalThis.window?.env || {};
    })();
  }
  return envPromise;
}

/* ───────────────────────────── init client ───────────────────────────── */
async function initClient() {
  // Якщо вже є ГОТОВИЙ клієнт — використовуємо його
  const maybe = globalThis.window?.supabase;
  const isClient =
    !!(maybe && typeof maybe === "object" && maybe.auth && typeof maybe.auth.getSession === "function");
  if (isClient) return maybe;

  // Отримуємо ENV
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = await getEnv();
  const url = must(SUPABASE_URL, "SUPABASE_URL");
  const key = must(SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY");

  // Визначаємо фабрику (UMD vs ESM)
  const create =
    globalThis.window?.supabase && typeof globalThis.window.supabase.createClient === "function"
      ? globalThis.window.supabase.createClient
      : createClient;

  const client = create(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: safeStorage, // захист від приватного режиму / ITP
    },
    global: {
      headers: { "x-happydate-client": "web" },
    },
  });

  // Зберігаємо саме КЛІЄНТА (не UMD-неймспейс) для повторного використання
  try { globalThis.window.supabase = client; } catch {}

  // Debug лог на локалі
  if (isLocalhost) {
    console.info("[Supabase] Client initialized", { url });
  }

  return client;
}

// Singleton export (top-level await)
export const supabase = await initClient();

/* ───────────────────────────── helpers API ───────────────────────────── */

/** Поточна сесія (або null) */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

/** Поточний користувач (або null) */
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/** Підписка на зміни auth + миттєвий виклик з поточною сесією */
export function onAuth(cb) {
  getSession().then((s) => { try { cb(s); } catch {} });
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
    try { cb(session); } catch {}
  });
  return () => sub?.subscription?.unsubscribe?.();
}

/** Запам’ятати/прочитати URL для повернення після логіну */
const REDIR_KEY = "happydate_post_login_redirect";
export function rememberNext(url) {
  try { sessionStorage.setItem(REDIR_KEY, url); } catch {}
}
export function consumeNext() {
  try {
    const v = sessionStorage.getItem(REDIR_KEY);
    if (v) sessionStorage.removeItem(REDIR_KEY);
    return v || null;
  } catch { return null; }
}

/**
 * Вимога логіну: якщо користувача немає — зберігаємо current URL і ведемо на /pages/login.html
 * Використовуй на приватних сторінках або перед діями, що потребують auth.
 */
export async function requireAuth(loginPath = "/pages/login.html") {
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (!user) {
    try {
      const next = location.pathname + location.search + location.hash;
      rememberNext(next);
    } catch {}
    location.href = loginPath;
    return null;
  }
  return user;
}

/* ───────────────────────────── auth shortcuts ───────────────────────────── */

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signUp(email, password, meta = {}) {
  const redirect =
    (typeof location !== "undefined" ? location.origin : "") + "/pages/dashboard.html";
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirect,
      data: Object.assign({ lang: (globalThis.window?.i18n?.getLang?.() || "pl") }, meta),
    },
  });
}

export function signInWithOAuth(provider = "google", redirect = "/pages/dashboard.html") {
  const redirectTo = (typeof location !== "undefined" ? location.origin : "") + redirect;
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

/* ───────────────────────────── domain helpers ───────────────────────────── */

/** Upsert профілю користувача (вимагає налаштовані RLS політики) */
export async function upsertMyProfile(patch) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak użytkownika / Користувач не авторизований");
  const row = Object.assign({ id: user.id }, patch);
  if (!row.email && user.email) row.email = user.email;
  return supabase.from("profiles").upsert(row, { onConflict: "id" });
}

/** Простий helper: чи користувач залогінений (без редіректу) */
export async function isLoggedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
}
