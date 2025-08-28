// /src/js/supabaseClient.js — HappyDate (production-ready, static hosting friendly)
/* eslint-disable no-console */
import { createClient as createClientESM } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Пріоритети джерел ENV:
 * 1) window.ENV.{SUPABASE_URL,SUPABASE_ANON_KEY}  ← /env.js
 * 2) window.env.{...}                              ← legacy
 * 3) <meta name="supabase-url" content="...">     ← опційно у <head>
 *    <meta name="supabase-anon-key" content="...">
 * 4) window.SUPABASE_URL / window.SUPABASE_ANON_KEY
 * 5) /api/env (Serverless/Edge)                    ← JSON з NEXT_PUBLIC_*
 */
let envPromise = null;

/* ───────────────────────────── guards/flags ───────────────────────────── */
const hasWindow = typeof window !== "undefined";
const isLocalhost =
  hasWindow && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
const CLIENT_HOLDER = "__hdSupabaseClient"; // не конфліктує з UMD namespace

/* ───────────────────────────── utils ───────────────────────────── */
function readMeta(name) {
  if (!hasWindow || !document) return null;
  try {
    return document
      .querySelector(`meta[name="${name}"]`)
      ?.getAttribute("content") || null;
  } catch {
    return null;
  }
}

// Безпечний storage: localStorage → sessionStorage → in-memory
const safeStorage = (() => {
  const tryStore = (store) => {
    if (!store) return null;
    try {
      const k = "__hd_test__";
      store.setItem(k, "1");
      store.removeItem(k);
      return store;
    } catch {
      return null;
    }
  };
  const ls = hasWindow ? tryStore(window.localStorage) : null;
  const ss = hasWindow ? tryStore(window.sessionStorage) : null;

  if (ls) return ls;
  if (ss) return ss;

  // in-memory fallback (на вкладку)
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
})();

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchEnvFromApi(retries = 2) {
  if (!hasWindow) return null;
  const url = "/api/env";
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (res.ok) return await res.json();
    } catch {
      /* retry */
    }
    await sleep(250 * (i + 1));
  }
  return null;
}

function normalizeEnv(json) {
  if (!json) return {};
  return {
    SUPABASE_URL:
      json.SUPABASE_URL ||
      json.NEXT_PUBLIC_SUPABASE_URL ||
      json.url ||
      null,
    SUPABASE_ANON_KEY:
      json.SUPABASE_ANON_KEY ||
      json.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      json.anon ||
      null,
  };
}

function must(val, name) {
  if (!val) {
    const msg = `[Supabase] Missing ${name}. Додай ключі у /env.js (window.ENV) або надішли через /api/env (NEXT_PUBLIC_*).`;
    console.error(msg);
    if (hasWindow && isLocalhost) {
      try {
        // невелика підказка тільки в dev
        alert(msg);
      } catch {}
    }
    throw new Error(msg);
  }
  return val;
}

/* ───────────────────────────── ENV loader ───────────────────────────── */
async function getEnv() {
  // 1) window.ENV
  if (hasWindow && window.ENV?.SUPABASE_URL && window.ENV?.SUPABASE_ANON_KEY) {
    return window.ENV;
  }
  // 2) window.env (legacy)
  if (hasWindow && window.env?.SUPABASE_URL && window.env?.SUPABASE_ANON_KEY) {
    return window.env;
  }
  // 3) META tags (optional)
  const metaUrl = readMeta("supabase-url");
  const metaKey = readMeta("supabase-anon-key");
  if (metaUrl && metaKey) {
    if (hasWindow) {
      window.ENV = Object.assign({}, window.ENV, {
        SUPABASE_URL: metaUrl,
        SUPABASE_ANON_KEY: metaKey,
      });
      return window.ENV;
    }
    return { SUPABASE_URL: metaUrl, SUPABASE_ANON_KEY: metaKey };
  }
  // 4) Глобальні змінні
  if (hasWindow && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    return {
      SUPABASE_URL: window.SUPABASE_URL,
      SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY,
    };
  }
  // 5) /api/env — memoized
  if (!envPromise) {
    envPromise = (async () => {
      const json = normalizeEnv(await fetchEnvFromApi());
      if (hasWindow && json.SUPABASE_URL && json.SUPABASE_ANON_KEY) {
        window.ENV = Object.assign({}, window.ENV, json);
      }
      return (hasWindow && (window.ENV || window.env)) || json || {};
    })();
  }
  return envPromise;
}

/* ───────────────────────────── init client ───────────────────────────── */
async function initClient() {
  // Ідемпотентність: вже створений?
  if (hasWindow && window[CLIENT_HOLDER]) return window[CLIENT_HOLDER];

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = await getEnv();
  const url = must(SUPABASE_URL, "SUPABASE_URL");
  const key = must(SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY");

  // Якщо на сторінці присутній UMD-бандл supabase (рідко, але можливо)
  const create =
    (hasWindow &&
      window.supabase &&
      typeof window.supabase.createClient === "function" &&
      window.supabase.createClient) ||
    createClientESM;

  const client = create(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // дозволяє ловити #access_token після OAuth
      storage: safeStorage,
    },
    global: {
      headers: { "x-happydate-client": "web" },
    },
  });

  // Зберігаємо єдиний інстанс у власному ключі, не ламаючи можливий UMD namespace
  if (hasWindow) {
    try {
      window[CLIENT_HOLDER] = client;
    } catch {}
  }

  if (isLocalhost) {
    console.info("[Supabase] Client initialized", { url });
  }

  return client;
}

// Singleton export (top-level await)
export const supabase = await initClient();

/* ───────────────────────────── helpers API ───────────────────────────── */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export function onAuth(cb) {
  getSession().then((s) => {
    try {
      cb(s);
    } catch {}
  });
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
    try {
      cb(session);
    } catch {}
  });
  return () => sub?.subscription?.unsubscribe?.();
}

// Redirect helpers (після логіну/логауту)
const REDIR_KEY = "happydate_post_login_redirect";
export function rememberNext(url) {
  try {
    (hasWindow ? window.sessionStorage : safeStorage).setItem(REDIR_KEY, url);
  } catch {}
}
export function consumeNext() {
  try {
    const store = hasWindow ? window.sessionStorage : safeStorage;
    const v = store.getItem(REDIR_KEY);
    if (v) store.removeItem(REDIR_KEY);
    return v || null;
  } catch {
    return null;
  }
}

/**
 * Вимога логіну: якщо користувача немає — зберігаємо current URL і редіректимо на /pages/login.html
 * Використовуй на приватних сторінках або перед діями, що потребують auth.
 */
export async function requireAuth(loginPath = "/pages/login.html") {
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (!user) {
    if (hasWindow) {
      try {
        const next =
          window.location.pathname +
          window.location.search +
          window.location.hash;
        rememberNext(next);
      } catch {}
      window.location.href = loginPath;
    }
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
    (hasWindow ? window.location.origin : "") + "/pages/dashboard.html";
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirect,
      data: Object.assign(
        { lang: (hasWindow && window.i18n?.getLang?.()) || "pl" },
        meta
      ),
    },
  });
}

export function signInWithOAuth(provider = "google", redirect = "/pages/dashboard.html") {
  const redirectTo = (hasWindow ? window.location.origin : "") + redirect;
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

/* ───────────────────────────── domain helpers ───────────────────────────── */
export async function upsertMyProfile(patch) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak użytkownika / Користувач не авторизований");
  const row = Object.assign({ id: user.id }, patch);
  if (!row.email && user.email) row.email = user.email;
  return supabase.from("profiles").upsert(row, { onConflict: "id" });
}

export async function isLoggedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
}

// Додатково: можливість отримати поточний інстанс (якщо дуже треба)
export function getClient() {
  return supabase;
}
