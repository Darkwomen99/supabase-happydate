// /src/js/theme-toggle.js — HappyDate (dark/light, a11y, sync, no-flicker)
(() => {
  const KEY  = "happy_theme";            // 'dark' | 'light'
  const html = document.documentElement;

  // Safe get/set localStorage
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch {} };

  // i18n helper (falls back to plaintext)
  const T = (key, fallback) => {
    try {
      if (window.i18next) {
        const val = window.i18next.t(key);
        if (val && val !== key) return val;
      }
    } catch {}
    return fallback;
  };

  // Use matchMedia safely (with legacy addListener fallback)
  const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };

  const getSaved = () => {
    const v = lsGet(KEY);
    return v === "dark" || v === "light" ? v : null;
  };

  const computeTheme = () => getSaved() || (mql.matches ? "dark" : "light");

  // Apply theme to <html>, update controls if present
  function applyTheme(theme) {
    const isDark = theme === "dark";
    html.classList.toggle("dark", isDark);
    html.setAttribute("data-theme", isDark ? "dark" : "light"); // корисно для CSS/аналітики

    // Update toggle elements if they exist
    const btn  = document.getElementById("theme-toggle");
    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = isDark ? "☀️" : "🌙";
    if (btn) {
      const label = isDark ? T("ui.theme.light", "Jasny motyw") : T("ui.theme.dark", "Ciemny motyw");
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", label);
      btn.title = label;
      btn.dataset.state = isDark ? "dark" : "light";
    }

    // Optional: update theme-color for mobile UI
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#0f172a" : "#ffffff");
  }

  function setTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    lsSet(KEY, next);
    applyTheme(next);
  }

  // 1) Apply immediately to avoid flicker (before DOMContentLoaded)
  applyTheme(computeTheme());

  // 2) Wire up interactions when DOM is ready (btn may not exist yet)
  function bindControls() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    const onClick = () => setTheme(html.classList.contains("dark") ? "light" : "dark");
    const onKey   = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    };

    // Prevent duplicate handlers on HMR/reloads
    btn.removeEventListener("click", onClick);
    btn.removeEventListener("keydown", onKey);
    btn.addEventListener("click", onClick);
    btn.addEventListener("keydown", onKey);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindControls, { once: true });
  } else {
    bindControls();
  }

  // 3) Sync between tabs
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) applyTheme(computeTheme());
  });

  // 4) Follow system when user hasn't chosen explicitly
  const onSchemeChange = () => { if (!getSaved()) applyTheme(computeTheme()); };
  if (typeof mql.addEventListener === "function") mql.addEventListener("change", onSchemeChange);
  else if (typeof mql.addListener === "function") mql.addListener(onSchemeChange);

  // 5) Tiny API for other scripts
  window.theme = {
    get: () => (html.classList.contains("dark") ? "dark" : "light"),
    set: (t) => setTheme(t),
    clear: () => { lsDel(KEY); applyTheme(computeTheme()); }, // back to system
  };
})();
