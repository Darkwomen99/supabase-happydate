// /src/js/i18n-init.js — легкий bootstrap i18n для статичних сторінок
(() => {
  // ───────────────────────────────────────────── Конфіг
  const UI_LANGS     = ["pl", "ua", "en", "ru", "de"];
  const FALLBACK     = ["pl", "en", "ua", "ru", "de"];
  const STORAGE_KEY  = "lang";

  const ENV       = window.ENV || {};
  const BASE_PATH = String(ENV.BASE_PATH || "");
  const VERSION   = String(ENV.APP_VERSION || "1.0.0");
  const LANG_PATH = String(ENV.LANG_PATH || "/src/i18n/{{lng}}.json");

  const hasI18n    = !!window.i18next;
  const hasBackend = !!window.i18nextHttpBackend;

  // ───────────────────────────────────────────── Хелпери
  const qs = new URLSearchParams(location.search);
  const queryLang = qs.get("lang");

  const mapToFileLang = (lng) => {
    const x = String(lng || "").toLowerCase();
    return x === "uk" ? "ua" : x;
  };
  const isSupportedUI = (lng) => UI_LANGS.includes(mapToFileLang(lng));
  const clampUI = (lng) => (isSupportedUI(lng) ? mapToFileLang(lng) : "pl");

  const getInitialLang = () => {
    if (queryLang) return clampUI(queryLang);
    try {
      const ls = localStorage.getItem(STORAGE_KEY);
      if (ls) return clampUI(ls);
    } catch {}
    const nav = (navigator.languages?.[0] || navigator.language || "pl").slice(0, 2);
    return clampUI(nav);
  };

  const setHtmlLang = (lng) => {
    const norm = clampUI(lng);
    const html = document.documentElement;
    html.setAttribute("lang", norm);
    html.setAttribute("dir", "ltr");
  };

  // Маленький паб-саб для зовнішніх слухачів
  const listeners = new Set();
  const emitChange = (lng) => {
    const norm = clampUI(lng);
    listeners.forEach((cb) => { try { cb(norm); } catch {} });
    document.dispatchEvent(new CustomEvent("happydate:langChanged", { detail: { lang: norm } }));
  };

  // Переклад елемента (textContent або innerHTML) + атрибути
  function translateElement(el) {
    if (!(el instanceof Element) || !hasI18n) return;
    const key = el.getAttribute("data-i18n");
    if (!key) return;

    const asHtml = el.hasAttribute("data-i18n-html");
    const value  = window.i18next.t(key);
    if (asHtml) el.innerHTML = value;
    else el.textContent = value;

    // Список атрибутів через data-i18n-attr="title,placeholder,aria-label"
    const attrList = (el.getAttribute("data-i18n-attr") || "")
      .split(",").map(s => s.trim()).filter(Boolean);

    attrList.forEach(attr => {
      const k = el.getAttribute(`data-i18n-${attr}`) || key;
      el.setAttribute(attr, window.i18next.t(k));
    });

    // Швидкі атрибути
    ["title", "placeholder", "aria-label"].forEach(attr => {
      const k = el.getAttribute(`data-i18n-${attr}`);
      if (k) el.setAttribute(attr, window.i18next.t(k));
    });
  }

  function translateAll() {
    if (!hasI18n) return;
    document.querySelectorAll("[data-i18n]").forEach(translateElement);
  }

  // Спостерігаємо за DOM, щоб перекладати динамічні вузли
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "data-i18n" && m.target) {
        translateElement(m.target);
      } else if (m.type === "childList") {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.hasAttribute?.("data-i18n")) translateElement(node);
            node.querySelectorAll?.("[data-i18n]")?.forEach(translateElement);
          }
        });
      }
    }
  });

  // Кнопки перемикання .lang-btn[data-lang]
  function wireLangButtons(getCurrent) {
    const buttons = document.querySelectorAll(".lang-btn[data-lang]");
    const setActive = (lng) => {
      const norm = clampUI(lng);
      buttons.forEach((btn) => {
        const btnLng = clampUI(btn.getAttribute("data-lang"));
        const isActive = btnLng === norm;
        btn.toggleAttribute("aria-current", isActive);
        btn.dataset.state = isActive ? "active" : "inactive";
      });
    };
    setActive(getCurrent());

    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const target = clampUI(btn.getAttribute("data-lang"));
        await setLang(target);
        setActive(target);
      });
    });
  }

  // Зміна мови
  async function setLang(lng) {
    const next = clampUI(lng);

    // Якщо є кастомний фасад (сумісність), делегуємо йому
    if (window.i18n && typeof window.i18n._internalSet === "function") {
      await window.i18n._internalSet(next);
      return;
    }

    if (!hasI18n) return;
    await window.i18next.changeLanguage(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    setHtmlLang(next);
    translateAll();
    emitChange(next);
  }

  // ───────────────────────────────────────────── Старт
  document.addEventListener("DOMContentLoaded", async () => {
    const initial = getInitialLang();

    // Якщо i18next вже ініціалізований — просто застосовуємо
    if (hasI18n && window.i18next.isInitialized) {
      await setLang(window.i18next.language || initial);
      translateAll();
      observer.observe(document.documentElement, {
        subtree: true, childList: true, attributes: true, attributeFilter: ["data-i18n"]
      });
      wireLangButtons(() => window.i18next.language);
    } else if (hasI18n) {
      // Повна ініціалізація i18next
      try {
        const chain = window.i18next;
        if (hasBackend) chain.use(window.i18nextHttpBackend);

        await chain.init({
          supportedLngs: ["pl", "en", "ru", "de", "ua", "uk"],
          nonExplicitSupportedLngs: true,
          fallbackLng: FALLBACK,
          load: "languageOnly",
          returnNull: false,
          backend: hasBackend ? {
            loadPath: (lngs) => {
              const lng = Array.isArray(lngs) ? lngs[0] : lngs;
              const fileLng = mapToFileLang(lng);
              const raw = (BASE_PATH + LANG_PATH).replace(/\/{2,}/g, "/");
              return raw.replace("{{lng}}", encodeURIComponent(fileLng)) + `?v=${encodeURIComponent(VERSION)}`;
            },
            requestOptions: { credentials: "same-origin" },
          } : undefined,
          initImmediate: true,
          lng: initial
        });

        setHtmlLang(window.i18next.language);
        translateAll();
        observer.observe(document.documentElement, {
          subtree: true, childList: true, attributes: true, attributeFilter: ["data-i18n"]
        });
        wireLangButtons(() => window.i18next.language);
      } catch (err) {
        console.error("[i18n-init] Init error:", err);
        setHtmlLang(initial);
        wireLangButtons(() => initial);
      }
    } else {
      // М'який фолбек без i18next (щоб не ламати сторінку)
      console.warn("[i18n-init] i18next не підключено — переклад не активний.");
      setHtmlLang(initial);
      wireLangButtons(() => initial);
    }

    // Спроба підхопити preferowaną mову з Supabase (user_metadata.lang)
    if (window.supabase?.auth && hasI18n) {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        const userLng = session?.user?.user_metadata?.lang;
        if (userLng && clampUI(userLng) !== clampUI(window.i18next.language)) {
          await setLang(userLng);
        }
      } catch {}
    }
  });

  // ───────────────────────────────────────────── Експорт фасаду (зручно для інших скриптів)
  window.i18n = window.i18n || {};
  // внутрішній сеттер (щоб уникнути подвійної логіки)
  window.i18n._internalSet = async (lng) => {
    if (!hasI18n) return;
    const next = clampUI(lng);
    await window.i18next.changeLanguage(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    setHtmlLang(next);
    translateAll();
    emitChange(next);
  };
  window.i18n.setLang = async (lng, { persist = true } = {}) => {
    const next = clampUI(lng);
    if (!hasI18n) return;
    await window.i18next.changeLanguage(next);
    if (persist) { try { localStorage.setItem(STORAGE_KEY, next); } catch {} }
    setHtmlLang(next);
    translateAll();
    emitChange(next);
  };
  window.i18n.getLang = () => {
    if (hasI18n && window.i18next.language) return clampUI(window.i18next.language);
    try {
      const ls = localStorage.getItem(STORAGE_KEY);
      if (ls) return clampUI(ls);
    } catch {}
    return clampUI((navigator.languages?.[0] || navigator.language || "pl").slice(0,2));
  };
  window.i18n.onChange = (cb) => { if (typeof cb === "function") listeners.add(cb); return () => listeners.delete(cb); };
})();
