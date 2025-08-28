// /src/js/i18n-init.js — легкий bootstrap i18n для статичних сторінок
(() => {
  // ───────────────────────────────────────────── Конфіг
  const UI_LANGS    = ["pl", "ua", "en", "ru", "de"]; // використовуємо 'ua', не 'uk'
  const FALLBACK    = ["pl", "en", "ua", "ru", "de"];
  const STORAGE_KEY = "lang";
  const EVENT_LANG_CHANGED = "happydate:langChanged";

  const ENV       = window.ENV || {};
  const BASE_PATH = String(ENV.BASE_PATH || "");
  const VERSION   = String(ENV.APP_VERSION || "1.0.0");
  // дефолт узгоджено з головним i18n
  const LANG_PATH = String(ENV.LANG_PATH || "/assets/lang/{{lng}}.json");

  const hasI18n    = !!window.i18next;
  const hasBackend = !!window.i18nextHttpBackend;

  // Ключі, яким дозволено HTML (все інше — textContent)
  const SAFE_HTML_KEYS = ["reviews.heroHtml"];

  // ───────────────────────────────────────────── Хелпери
  const qs = new URLSearchParams(location.search);
  const queryLang = qs.get("lang");

  // приймаємо 'uk', але мапимо у 'ua'
  const mapToUiLang = (lng) => {
    const x = String(lng || "").toLowerCase();
    return x === "uk" ? "ua" : x;
  };
  const isSupportedUI = (lng) => UI_LANGS.includes(mapToUiLang(lng));
  const clampUI = (lng) => (isSupportedUI(lng) ? mapToUiLang(lng) : "pl");

  const safeGetLS = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const safeSetLS = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  const getInitialLang = () => {
    if (queryLang) return clampUI(queryLang);
    const ls = safeGetLS(STORAGE_KEY);
    if (ls) return clampUI(ls);
    const nav = (navigator.languages?.[0] || navigator.language || "pl").slice(0, 2);
    return clampUI(nav);
  };

  const setHtmlLang = (lng) => {
    const norm = clampUI(lng);
    const html = document.documentElement;
    html.setAttribute("lang", norm);
    html.setAttribute("dir", "ltr");
  };

  // Маленький паб-саб + системна подія
  const listeners = new Set();
  const emitChange = (lng) => {
    const norm = clampUI(lng);
    listeners.forEach((cb) => { try { cb(norm); } catch {} });
    document.dispatchEvent(new CustomEvent(EVENT_LANG_CHANGED, { detail: { lang: norm } }));
  };

  // ───────────────────────────────────────────── Переклад
  function translateElement(el) {
    if (!(el instanceof Element) || !hasI18n) return;
    const key = el.getAttribute("data-i18n");
    if (!key) return;

    const asHtml = el.hasAttribute("data-i18n-html");
    const value  = window.i18next.t(key);

    if (asHtml && SAFE_HTML_KEYS.includes(key)) el.innerHTML = value;
    else el.textContent = value;

    // Перелік атрибутів у data-i18n-attr="title,placeholder,aria-label"
    const attrList = (el.getAttribute("data-i18n-attr") || "")
      .split(",").map(s => s.trim()).filter(Boolean);

    attrList.forEach(attr => {
      const k = el.getAttribute(`data-i18n-${attr}`) || key;
      const tv = window.i18next.t(k);
      if (tv != null) el.setAttribute(attr, tv);
    });

    // Швидкі атрибути
    ["title", "placeholder", "aria-label"].forEach(attr => {
      const k = el.getAttribute(`data-i18n-${attr}`);
      if (k) {
        const tv = window.i18next.t(k);
        if (tv != null) el.setAttribute(attr, tv);
      }
    });
  }

  // Батчимо переклад для серій змін DOM
  let translateScheduled = false;
  function translateAll() {
    if (!hasI18n) return;
    if (translateScheduled) return;
    translateScheduled = true;
    requestAnimationFrame(() => {
      document.querySelectorAll("[data-i18n]").forEach(translateElement);
      translateScheduled = false;
    });
  }

  // Спостерігаємо за DOM, щоб перекладати динамічні вузли
  const observer = new MutationObserver((mutations) => {
    let needFullPass = false;
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
      } else {
        needFullPass = true;
      }
    }
    if (needFullPass) translateAll();
  });

  // Кнопки перемикання .lang-btn[data-lang]
  function wireLangButtons(getCurrent) {
    const buttons = Array.from(document.querySelectorAll(".lang-btn[data-lang]"));

    const setActive = (lng) => {
      const norm = clampUI(lng);
      buttons.forEach((btn) => {
        const btnLng = clampUI(btn.getAttribute("data-lang"));
        const isActive = btnLng === norm;
        btn.toggleAttribute("aria-current", isActive);
        btn.dataset.state = isActive ? "active" : "inactive";
      });
    };

    // onClick → зміна мови
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const target = clampUI(btn.getAttribute("data-lang"));
        await setLang(target);
      });
    });

    // реакція на зовнішню зміну
    document.addEventListener(EVENT_LANG_CHANGED, (e) => {
      const lng = e.detail?.lang || getCurrent();
      setActive(lng);
    });

    setActive(getCurrent());
  }

  // ───────────────────────────────────────────── Зміна мови
  async function setLang(lng) {
    const next = clampUI(lng);

    // Якщо є кастомний фасад (сумісність) — делегуємо
    if (window.i18n && typeof window.i18n._internalSet === "function") {
      await window.i18n._internalSet(next);
      return;
    }

    if (!hasI18n) return;
    await window.i18next.changeLanguage(next);
    safeSetLS(STORAGE_KEY, next);
    setHtmlLang(next);
    translateAll();
    emitChange(next);
  }

  // ───────────────────────────────────────────── Старт
  const boot = async () => {
    const initial = getInitialLang();

    if (hasI18n && window.i18next.isInitialized) {
      // вже ініціалізований — просто застосовуємо
      await setLang(window.i18next.language || initial);
      translateAll();
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          "data-i18n",
          "data-i18n-attr",
          "data-i18n-html",
          "data-i18n-title",
          "data-i18n-placeholder",
          "data-i18n-aria-label",
        ],
      });
      wireLangButtons(() => window.i18next.language);
    } else if (hasI18n) {
      // Повна ініціалізація i18next
      try {
        const chain = window.i18next;
        if (hasBackend) chain.use(window.i18nextHttpBackend);

        await chain.init({
          supportedLngs: ["pl", "en", "ru", "de", "ua", "uk"], // 'uk' приймаємо, але віддаємо 'ua'
          nonExplicitSupportedLngs: true,
          fallbackLng: FALLBACK,
          load: "languageOnly",
          returnNull: false,
          backend: hasBackend
            ? {
                loadPath: (lngs) => {
                  const lng = Array.isArray(lngs) ? lngs[0] : lngs;
                  const fileLng = mapToUiLang(lng); // нормалізуємо у 'ua' при потребі
                  const raw = (BASE_PATH + "/" + LANG_PATH).replace(/\/{2,}/g, "/");
                  return raw.replace("{{lng}}", encodeURIComponent(fileLng)) + `?v=${encodeURIComponent(VERSION)}`;
                },
                requestOptions: { credentials: "same-origin" },
              }
            : undefined,
          initImmediate: true,
          lng: initial,
        });

        setHtmlLang(window.i18next.language);
        translateAll();
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [
            "data-i18n",
            "data-i18n-attr",
            "data-i18n-html",
            "data-i18n-title",
            "data-i18n-placeholder",
            "data-i18n-aria-label",
          ],
        });
        wireLangButtons(() => window.i18next.language);
      } catch (err) {
        console.error("[i18n-init] Init error:", err);
        setHtmlLang(initial);
        wireLangButtons(() => initial);
      }
    } else {
      // М'який фолбек без i18next
      console.warn("[i18n-init] i18next не підключено — переклад не активний.");
      setHtmlLang(initial);
      wireLangButtons(() => initial);
    }

    // Перевага з Supabase (user_metadata.lang)
    if (window.supabase?.auth && hasI18n) {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        const userLng = session?.user?.user_metadata?.lang;
        if (userLng && clampUI(userLng) !== clampUI(window.i18next.language)) {
          await setLang(userLng);
        }
      } catch {}
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // ───────────────────────────────────────────── Експорт фасаду
  window.i18n = window.i18n || {};
  // внутрішній сеттер для делегації
  window.i18n._internalSet = async (lng) => {
    if (!hasI18n) return;
    const next = clampUI(lng);
    await window.i18next.changeLanguage(next);
    safeSetLS(STORAGE_KEY, next);
    setHtmlLang(next);
    translateAll();
    emitChange(next);
  };
  window.i18n.setLang = async (lng, { persist = true } = {}) => {
    if (!hasI18n) return;
    const next = clampUI(lng);
    await window.i18next.changeLanguage(next);
    if (persist) safeSetLS(STORAGE_KEY, next);
    setHtmlLang(next);
    translateAll();
    emitChange(next);
  };
  window.i18n.getLang = () => {
    if (hasI18n && window.i18next.language) return clampUI(window.i18next.language);
    const ls = safeGetLS(STORAGE_KEY);
    if (ls) return clampUI(ls);
    return clampUI((navigator.languages?.[0] || navigator.language || "pl").slice(0, 2));
  };
  window.i18n.onChange = (cb) => { if (typeof cb === "function") listeners.add(cb); return () => listeners.delete(cb); };
})();
