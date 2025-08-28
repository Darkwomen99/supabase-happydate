// /src/js/auth.js — HappyDate Auth (Supabase v2, static hosting friendly)
import { supabase } from "/src/js/supabaseClient.js";

/* ───────────────────────────── helpers ───────────────────────────── */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const EVENTS = {
  AUTH_CHANGED: "happydate:authChanged",
  AUTH_ERROR: "happydate:authError",
  ROUTE_BLOCKED: "happydate:routeGuardBlocked",
};

const t = (key, fallback) => (window.i18n?.t?.(key) ?? fallback ?? key);

function setFeedback(container, msg, type = "info") {
  if (!container) return;
  container.textContent = msg || "";
  container.dataset.type = type; // стилізуй [data-type="error"|"success"|"info"] у CSS
  container.hidden = !msg;
}

function setLoading(form, loading = true, label = "…") {
  const btn = form?.querySelector('[type="submit"]');
  if (!btn) return;
  btn.disabled = !!loading;
  if (loading) {
    btn.dataset._label = btn.textContent;
    btn.innerHTML =
      `<span class="inline-block align-middle w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>${label}`;
  } else {
    btn.textContent = btn.dataset._label || btn.textContent;
  }
}

function toggleAuthVisibility(session) {
  const signedIn = !!session?.user;
  $$("[data-auth-visible='signed-in']").forEach((el) => (el.hidden = !signedIn));
  $$("[data-auth-visible='signed-out']").forEach((el) => (el.hidden = signedIn));
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

// same-origin only (без open-redirect)
function safeRedirect(urlLike) {
  try {
    if (!urlLike) return null;
    const u = new URL(urlLike, location.origin);
    if (u.origin !== location.origin) return null;
    return u.pathname + u.search + u.hash;
  } catch { return null; }
}

const StorageKeys = { POST_LOGIN_NEXT: "happydate_post_login_redirect" };
const rememberNext = (url) => { try { sessionStorage.setItem(StorageKeys.POST_LOGIN_NEXT, url); } catch {} };
const consumeNext  = () => { try {
  const v = sessionStorage.getItem(StorageKeys.POST_LOGIN_NEXT);
  if (v) sessionStorage.removeItem(StorageKeys.POST_LOGIN_NEXT);
  return v || null;
} catch { return null; } };
const postLoginRedirect = () => {
  const next = safeRedirect(consumeNext());
  if (next) { location.href = next; }
};
const getLang = () => window.i18n?.getLang?.() || localStorage.getItem("lang") || "pl";

/* ───────────────────────────── route guard ───────────────────────────── */
async function routeGuard() {
  const body = document.body;
  if (body?.getAttribute("data-auth-guard") !== "required") return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    const next = location.pathname + location.search + location.hash;
    const redirectTo = safeRedirect(body.getAttribute("data-auth-redirect")) || "/pages/login.html";
    rememberNext(next);
    document.dispatchEvent(new CustomEvent(EVENTS.ROUTE_BLOCKED, { detail: { next, redirectTo }, bubbles: true }));
    location.href = redirectTo;
  }
}

/* ───────────────────────────── forms wiring ───────────────────────────── */
function wireForms() {
  // SIGN IN
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
        const m = (error.message || "").toLowerCase();
        const nice =
          m.includes("invalid") ? t("auth.errors.badCredentials", "Nieprawidłowy e-mail lub hasło.")
        : m.includes("email not confirmed") ? t("auth.errors.emailNotConfirmed", "Potwierdź e-mail przed logowaniem.")
        : t("auth.errors.generic", "Nie udało się zalogować.");
        setFeedback(fb, nice, "error");
        document.dispatchEvent(new CustomEvent(EVENTS.AUTH_ERROR, { detail: { error }, bubbles: true }));
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
        setFeedback(fb, t("auth.signup.error", "Nie udało się utworzyć konta.") + ` ${error.message || ""}`, "error");
        document.dispatchEvent(new CustomEvent(EVENTS.AUTH_ERROR, { detail: { error }, bubbles: true }));
        return;
      }

      setFeedback(fb, t("auth.signup.checkEmail", "Konto utworzone. Sprawdź e-mail i potwierdź rejestrację."), "success");

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
        document.dispatchEvent(new CustomEvent(EVENTS.AUTH_ERROR, { detail: { error }, bubbles: true }));
        return;
      }
      setFeedback(fb, t("auth.reset.sent", "Sprawdź e-mail. Wysłaliśmy link do zmiany hasła."), "success");
    });
  });

  // UPDATE PASSWORD
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
        document.dispatchEvent(new CustomEvent(EVENTS.AUTH_ERROR, { detail: { error }, bubbles: true }));
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
        document.dispatchEvent(new CustomEvent(EVENTS.AUTH_ERROR, { detail: { error }, bubbles: true }));
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

/* ───────────────────────────── boot ───────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  // Якщо повернулися з листа / OAuth: обміняти ?code=... на сесію і прибрати з URL
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

  await routeGuard();
  wireForms();

  // Стартовий стан
  supabase.auth.getSession().then(({ data }) => {
    toggleAuthVisibility(data.session);
    bindUserUI(data.session);
    document.dispatchEvent(new CustomEvent(EVENTS.AUTH_CHANGED, { detail: { session: data.session }, bubbles: true }));
  });

  // Підписка на зміни auth
  supabase.auth.onAuthStateChange((_event, session) => {
    toggleAuthVisibility(session);
    bindUserUI(session);
    document.dispatchEvent(new CustomEvent(EVENTS.AUTH_CHANGED, { detail: { session }, bubbles: true }));
  });
});

// Експортуємо невелике API (якщо комусь знадобиться)
export const auth = {
  async getSession() { return supabase.auth.getSession(); },
  async getUser() { const { data: { user } } = await supabase.auth.getUser(); return user || null; },
  onAuth(cb) {
    supabase.auth.getSession().then(({ data }) => { try { cb(data.session); } catch {} });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { try { cb(s); } catch {} });
    window.addEventListener("beforeunload", () => sub?.subscription?.unsubscribe?.());
  },
  async requireAuth({ redirectTo = "/pages/login.html" } = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const next = location.pathname + location.search + location.hash;
      rememberNext(next);
      location.href = safeRedirect(redirectTo) || "/pages/login.html";
      return null;
    }
    return session.user;
  },
  async signIn(email, password) { return supabase.auth.signInWithPassword({ email, password }); },
  async signUp(email, password, userMeta = {}) {
    return supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: location.origin + "/pages/profile.html", data: { lang: getLang(), ...userMeta } }
    });
  },
  async signOut() { return supabase.auth.signOut(); },
  async sendReset(email) {
    return supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/pages/reset-password.html" });
  }
};
