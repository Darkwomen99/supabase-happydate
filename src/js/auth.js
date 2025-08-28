// /src/js/auth.js — HappyDate Auth (Supabase v2, production-ready, safe redirects, i18n-ready)
(() => {
  const EVENTS = {
    AUTH_CHANGED: "happydate:authChanged",
    AUTH_ERROR: "happydate:authError",
    ROUTE_BLOCKED: "happydate:routeGuardBlocked",
  };

  /* ───────────────────────────── helpers ───────────────────────────── */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fire = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));

  const t = (key, fallback) => (window.i18n?.t?.(key) ?? fallback);

  function setFeedback(container, msg, type = "info") {
    if (!container) return;
    container.textContent = msg || "";
    container.dataset.type = type; // стилізуй [data-type="error"|"success"|"info"] у CSS
    container.hidden = !msg;
  }

  function setLoading(form, loading = true, labelWhenLoading = "…") {
    const btn = form?.querySelector('[type="submit"]');
    if (!btn) return;
    btn.disabled = !!loading;
    if (loading) {
      btn.dataset._label = btn.textContent;
      btn.innerHTML =
        `<span class="inline-block align-middle w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>${labelWhenLoading}`;
    } else {
      btn.textContent = btn.dataset._label || btn.textContent;
    }
  }

  function toggleAuthVisibility(session) {
    const signedIn = !!session?.user;
    $$("[data-auth-visible='signed-in']").forEach(el => (el.hidden = !signedIn));
    $$("[data-auth-visible='signed-out']").forEach(el => (el.hidden = signedIn));
  }

  function bindUserUI(session) {
    const user   = session?.user;
    const email  = user?.email || "";
    const name   = user?.user_metadata?.full_name || user?.user_metadata?.name || email.split("@")[0] || "";
    const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

    $$("[data-auth-bind]").forEach((el) => {
      const key = el.getAttribute("data-auth-bind");
      if (key === "email") el.textContent = email;
      if (key === "name")  el.textContent = name;
      if (key === "avatar") {
        if (el.tagName === "IMG") {
          el.setAttribute("src", avatar || "https://api.dicebear.com/8.x/fun-emoji/svg?seed=gift");
          el.setAttribute("alt", name || email || "avatar");
          el.setAttribute("referrerpolicy", "no-referrer");
        } else {
          el.style.backgroundImage = avatar ? `url(${avatar})` : "";
        }
      }
    });

    const loginLink    = document.getElementById("login-link");
    const registerLink = document.getElementById("register-link");
    const avatarLink   = document.getElementById("user-avatar-link");
    const avatarImg    = document.getElementById("user-avatar");

    if (user) {
      loginLink   ?.classList.add("hidden");
      registerLink?.classList.add("hidden");
      if (avatarLink) {
        if (avatarImg) {
          avatarImg.src = avatar || "https://api.dicebear.com/8.x/fun-emoji/svg?seed=gift";
          avatarImg.alt = name || email || "Profil";
          avatarImg.referrerPolicy = "no-referrer";
        }
        avatarLink.classList.remove("hidden");
      }
    } else {
      loginLink   ?.classList.remove("hidden");
      registerLink?.classList.remove("hidden");
      avatarLink  ?.classList.add("hidden");
    }
  }

  // Same-origin redirect only (prevents open-redirect)
  function safeRedirect(urlLike) {
    try {
      if (!urlLike) return null;
      const u = new URL(urlLike, location.origin);
      if (u.origin !== location.origin) return null;
      return u.pathname + u.search + u.hash;
    } catch { return null; }
  }

  const StorageKeys = {
    POST_LOGIN_NEXT: "happydate_post_login_redirect",
  };

  function rememberNext(url) {
    try { sessionStorage.setItem(StorageKeys.POST_LOGIN_NEXT, url); } catch {}
  }

  function consumeNext() {
    try {
      const v = sessionStorage.getItem(StorageKeys.POST_LOGIN_NEXT);
      if (v) sessionStorage.removeItem(StorageKeys.POST_LOGIN_NEXT);
      return v || null;
    } catch { return null; }
  }

  function postLoginRedirect() {
    const next = safeRedirect(consumeNext());
    if (next) { location.href = next; return; }
  }

  function getLang() {
    return window.i18n?.getLang?.() || localStorage.getItem("lang") || "pl";
  }

  /* ───────────────────────────── supabase bootstrap ───────────────────────────── */
  async function fetchEnvFromApi() {
    try {
      const res = await fetch("/api/env", {
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  async function ensureSupabase() {
    if (window.supabase && window.supabase.auth?.getSession) return window.supabase;

    // 1) Try project singleton
    try {
      const mod = await import("/src/js/supabaseClient.js");
      if (mod?.supabase?.auth?.getSession) {
        window.supabase = mod.supabase;
        return window.supabase;
      }
    } catch (e) {
      console.warn("[auth] supabaseClient.js import failed:", e);
    }

    // 2) ENV (env.js) or /api/env
    const env = window.ENV || await fetchEnvFromApi();
    const SUPABASE_URL = env?.SUPABASE_URL || env?.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = env?.SUPABASE_ANON_KEY || env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[auth] Missing SUPABASE_URL / SUPABASE_ANON_KEY (env.js or /api/env).");
      return null;
    }

    // 3) ESM fallback
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return window.supabase;
  }

  /* ───────────────────────────── route guard ───────────────────────────── */
  async function routeGuard(supabase) {
    const body = document.body;
    const guard = body?.getAttribute("data-auth-guard");
    if (guard !== "required") return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const next = location.pathname + location.search + location.hash;
      const redirectTo = safeRedirect(body.getAttribute("data-auth-redirect")) || "/pages/login.html";
      rememberNext(next);
      fire(EVENTS.ROUTE_BLOCKED, { next, redirectTo });
      location.href = redirectTo;
    }
  }

  /* ───────────────────────────── forms wiring ───────────────────────────── */
  function wireForms(supabase) {
    // SIGN IN (email/password)
    $$('form[data-auth="sign-in"]').forEach((form) => {
      const fb = form.querySelector("[data-auth-feedback]");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setFeedback(fb, t("auth.signingIn", "Logowanie…"), "info");
        setLoading(form, true, t("auth.signingIn", "Logowanie…"));

        const email    = form.querySelector('[name="email"]')?.value?.trim();
        const password = form.querySelector('[name="password"]')?.value;

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(form, false);
        if (error) {
          const msg = (error.message || "").toLowerCase();
          const nice =
            msg.includes("invalid") ? t("auth.errors.badCredentials", "Nieprawidłowy e-mail lub hasło.") :
            msg.includes("email not confirmed") ? t("auth.errors.emailNotConfirmed", "Potwierdź e-mail przed logowaniem.") :
            t("auth.errors.generic", "Nie udało się zalogować.");
          setFeedback(fb, nice, "error");
          fire(EVENTS.AUTH_ERROR, { error });
          return;
        }
        setFeedback(fb, "");
        postLoginRedirect();
        const next = safeRedirect(form.getAttribute("data-auth-next"));
        if (next) location.href = next; else location.reload();
      });
    });

    // SIGN UP
    $$('form[data-auth="sign-up"]').forEach((form) => {
      const fb = form.querySelector("[data-auth-feedback]");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setFeedback(fb, t("auth.signup.creating", "Zakładanie konta…"), "info");
        setLoading(form, true, t("auth.signup.creating", "Zakładanie konta…"));

        const email    = form.querySelector('[name="email"]')?.value?.trim();
        const password = form.querySelector('[name="password"]')?.value;
        const lang     = getLang();

        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: location.origin + "/pages/profile.html",
            data: { lang }
          }
        });

        setLoading(form, false);

        if (error) {
          setFeedback(
            fb,
            t("auth.signup.error", "Nie udało się utworzyć konta.") + ` ${error.message || ""}`,
            "error"
          );
          fire(EVENTS.AUTH_ERROR, { error });
          return;
        }

        // Dwa scenariusze — email confirm włączony/wyłączony
        setFeedback(
          fb,
          t("auth.signup.checkEmail", "Konto utworzone. Sprawdź e-mail i potwierdź rejestrację."),
          "success"
        );

        const next = safeRedirect(form.getAttribute("data-auth-next"));
        if (data?.user && next) location.href = next;
      });
    });

    // RESET (send link)
    $$('form[data-auth="reset"]').forEach((form) => {
      const fb = form.querySelector("[data-auth-feedback]");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setFeedback(fb, t("auth.reset.sending", "Wysyłanie linku resetującego…"), "info");
        setLoading(form, true, t("auth.reset.sending", "Wysyłanie linku resetującego…"));

        const email = form.querySelector('[name="email"]')?.value?.trim();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/pages/reset-password.html"
        });

        setLoading(form, false);

        if (error) {
          setFeedback(fb, t("auth.reset.error", "Nie udało się wysłać wiadomości.") + ` ${error.message || ""}`, "error");
          fire(EVENTS.AUTH_ERROR, { error });
          return;
        }
        setFeedback(fb, t("auth.reset.sent", "Sprawdź e-mail. Wysłaliśmy link do zmiany hasła."), "success");
      });
    });

    // UPDATE PASSWORD (after reset link)
    $$('form[data-auth="update-password"]').forEach((form) => {
      const fb = form.querySelector("[data-auth-feedback]");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setFeedback(fb, t("auth.update.updating", "Aktualizowanie hasła…"), "info");
        setLoading(form, true, t("auth.update.updating", "Aktualizowanie hasła…"));

        const password = form.querySelector('[name="password"]')?.value;
        const { error } = await supabase.auth.updateUser({ password });

        setLoading(form, false);

        if (error) {
          setFeedback(fb, t("auth.update.error", "Błąd aktualizacji hasła.") + ` ${error.message || ""}`, "error");
          fire(EVENTS.AUTH_ERROR, { error });
          return;
        }
        setFeedback(fb, t("auth.update.done", "Hasło zaktualizowane. Możesz się zalogować."), "success");
        const next = safeRedirect(form.getAttribute("data-auth-next"));
        if (next) location.href = next;
      });
    });

    // OAUTH buttons
    $$("[data-auth-provider]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const provider = btn.getAttribute("data-auth-provider");
        const lang     = getLang();
        const after    = btn.getAttribute("data-auth-callback") || "/pages/profile.html";

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: location.origin + after,
            queryParams: { prompt: "select_account", ui_locales: lang }
          }
        });

        if (error) {
          console.error("[auth] OAuth start error:", error);
          fire(EVENTS.AUTH_ERROR, { error });
        }
      });
    });

    // SIGN OUT
    $$('[data-auth="sign-out"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        const next = safeRedirect(btn.getAttribute("data-auth-next"));
        if (next) location.href = next; else location.reload();
      });
    });
  }

  /* ───────────────────────────── public API ───────────────────────────── */
  const api = {
    async getSession() {
      const supabase = await ensureSupabase();
      return supabase?.auth.getSession();
    },
    async getUser() {
      const supabase = await ensureSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      return user || null;
    },
    onAuth(cb) {
      ensureSupabase().then(async (supabase) => {
        const { data: { session } } = await supabase.auth.getSession();
        try { cb(session); } catch {}
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { try { cb(s); } catch {} });
        // optional cleanup
        window.addEventListener("beforeunload", () => sub?.subscription?.unsubscribe?.());
      });
    },
    async requireAuth(opts = {}) {
      const supabase = await ensureSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        const next = location.pathname + location.search + location.hash;
        rememberNext(next);
        location.href = safeRedirect(opts.redirectTo) || "/pages/login.html";
        return null;
      }
      return session.user;
    },
    async signIn(email, password) {
      const supabase = await ensureSupabase();
      return supabase.auth.signInWithPassword({ email, password });
    },
    async signUp(email, password, userMeta = {}) {
      const supabase = await ensureSupabase();
      return supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: location.origin + "/pages/profile.html",
          data: { lang: getLang(), ...userMeta }
        }
      });
    },
    async signOut() {
      const supabase = await ensureSupabase();
      return supabase.auth.signOut();
    },
    async sendReset(email) {
      const supabase = await ensureSupabase();
      return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + "/pages/reset-password.html"
      });
    },
    async upsertProfile(partial) {
      const supabase = await ensureSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Brak użytkownika");
      return supabase.from("profiles").upsert({ id: user.id, ...partial });
    }
  };
  window.auth = api;

  /* ───────────────────────────── boot ───────────────────────────── */
  document.addEventListener("DOMContentLoaded", async () => {
    const supabase = await ensureSupabase();
    if (!supabase) return;

    // Exchange code (email link / oauth)
    (async () => {
      try {
        const url = new URL(location.href);
        const code = url.searchParams.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code).catch(() => {});
          url.searchParams.delete("code");
          url.searchParams.delete("error_description");
          history.replaceState({}, document.title, url.pathname + url.search + url.hash);
        }
      } catch {}
    })();

    await routeGuard(supabase);
    wireForms(supabase);

    supabase.auth.getSession().then(({ data }) => {
      toggleAuthVisibility(data.session);
      bindUserUI(data.session);
      fire(EVENTS.AUTH_CHANGED, { session: data.session });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      toggleAuthVisibility(session);
      bindUserUI(session);
      fire(EVENTS.AUTH_CHANGED, { session });
    });
  });
})();
