// /src/js/lang.js — HappyDate i18n (production-ready)
(() => {
  // --- Config ---------------------------------------------------------------
  const SUPPORTED = ["pl", "en", "ua", "ru"]; // узгоджено з HTML
  const STORAGE_KEY = "lang";
  const VERSION =
    (window.ENV && window.ENV.APP_VERSION) ||
    (location.hostname === "localhost" ? String(Date.now()) : "1.0.0"); // dev → cache bust

  const EVENT_LANG_CHANGED = "happydate:langChanged";

  // --- Guards ---------------------------------------------------------------
  if (
    !window.i18next ||
    !window.i18nextHttpBackend ||
    !window.i18nextBrowserLanguageDetector
  ) {
    console.error(
      "[i18n] Brak i18next lub pluginów. Dodaj <script> dla i18next, HttpBackend i LanguageDetector."
    );
    return;
  }

  // --- Utils ----------------------------------------------------------------
  const qs = new URLSearchParams(location.search);
  const langFromQuery = qs.get("lang");

  const isSupported = (lng) =>
    SUPPORTED.includes(String(lng || "").toLowerCase());

  const clamp = (lng) => (isSupported(lng) ? String(lng).toLowerCase() : "pl");

  const safeGetLS = (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const safeSetLS = (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  };

  const setHtmlLang = (lng) => {
    const html = document.documentElement;
    html.setAttribute("lang", lng);
    html.setAttribute("dir", "ltr"); // змінити, якщо додасте RTL
  };

  const dispatchLangChanged = (lng) => {
    document.dispatchEvent(new CustomEvent(EVENT_LANG_CHANGED, { detail: { lang: lng } }));
  };

  // Whitelist ключів, які можна рендерити як HTML (усе інше — як текст)
  const SAFE_HTML_KEYS = ["reviews.heroHtml"];

  // --- Translation ----------------------------------------------------------
  const translateElement = (el) => {
    if (!(el instanceof Element)) return;

    const key = el.getAttribute("data-i18n");
    if (!key) return;

    const asHtml = el.hasAttribute("data-i18n-html");
    const value = i18next.t(key);

    if (asHtml && SAFE_HTML_KEYS.includes(key)) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }

    // Переклад атрибутів (список у data-i18n-attr="title,placeholder,aria-label")
    const attrList = (el.getAttribute("data-i18n-attr") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    attrList.forEach((attr) => {
      const dataKey = el.getAttribute(`data-i18n-${attr}`);
      const attrValue = i18next.t(dataKey || key);
      if (attrValue != null) el.setAttribute(attr, attrValue);
    });

    // Шорткати для найчастіших атрибутів
    ["title", "placeholder", "aria-label"].forEach((attr) => {
      const dataKey = el.getAttribute(`data-i18n-${attr}`);
      if (dataKey) {
        const attrValue = i18next.t(dataKey);
        if (attrValue != null) el.setAttribute(attr, attrValue);
      }
    });
  };

  // Щоб не «молотити» DOM при серіях мутацій — батчимо переклад
  let translateScheduled = false;
  const translateAll = () => {
    if (translateScheduled) return;
    translateScheduled = true;
    // мікротаск/кадр — достатньо для склеювання змін
    requestAnimationFrame(() => {
      document.querySelectorAll("[data-i18n]").forEach(translateElement);
      translateScheduled = false;
    });
  };

  // --- MutationObserver -----------------------------------------------------
  const observer = new MutationObserver((mutations) => {
    let shouldTranslateAll = false;

    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "data-i18n") {
        translateElement(m.target);
      } else if (m.type === "childList") {
        // є нові вузли з data-i18n? — перекладаємо тільки їх
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = /** @type {Element} */ (node);
          if (el.hasAttribute?.("data-i18n")) translateElement(el);
          el.querySelectorAll?.("[data-i18n]")?.forEach(translateElement);
        });
      } else {
        shouldTranslateAll = true;
      }
    }

    if (shouldTranslateAll) translateAll();
  });

  // --- Lang buttons ---------------------------------------------------------
  const wireLangButtons = () => {
    const buttons = Array.from(document.querySelectorAll(".lang-btn[data-lang]"));

    const setActive = (lng) => {
      buttons.forEach((btn) => {
        const isActive = btn.getAttribute("data-lang") === lng;
        btn.toggleAttribute("aria-current", isActive);
        btn.dataset.state = isActive ? "active" : "inactive";
      });
    };

    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const lng = clamp(btn.getAttribute("data-lang"));
        await changeLanguage(lng, { persist: true, syncSupabase: true });
      });
    });

    // оновлюємо виділення при зміні мови з будь-якого місця
    document.addEventListener(EVENT_LANG_CHANGED, (e) => {
      const lng = e.detail?.lang || i18next.language;
      setActive(lng);
    });

    setActive(i18next.language);
  };

  // --- Change language ------------------------------------------------------
  async function changeLanguage(lng, { persist = true, syncSupabase = false } = {}) {
    const next = clamp(lng);
    if (next === i18next.language) {
      // все одно оновимо html[lang] — на випадок позасторонніх змін
      setHtmlLang(next);
      dispatchLangChanged(next);
      return next;
    }

    await i18next.changeLanguage(next);
    setHtmlLang(next);
    translateAll();
    if (persist) safeSetLS(STORAGE_KEY, next);
    dispatchLangChanged(next);

    if (syncSupabase && window.supabase?.auth?.getSession) {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session?.user) {
          await window.supabase.auth.updateUser({ data: { lang: next } });
        }
      } catch (e) {
        console.warn("[i18n] Nie udało się zapisać języka w Supabase:", e && e.message ? e.message : e);
      }
    }
    return next;
  }

  // --- Init -----------------------------------------------------------------
  i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init(
      {
        supportedLngs: SUPPORTED,
        nonExplicitSupportedLngs: true,
        fallbackLng: { default: ["pl"] },
        load: "languageOnly",
        returnNull: false,
        detection: {
          order: ["querystring", "localStorage", "navigator"],
          lookupQuerystring: "lang",
          lookupLocalStorage: STORAGE_KEY,
          caches: [], // самі керуємо localStorage
        },
        backend: {
          loadPath: `/assets/lang/{{lng}}.json?v=${encodeURIComponent(VERSION)}`,
          requestOptions: { credentials: "same-origin" },
        },
        interpolation: { escapeValue: false },
        initImmediate: true,
      },
      async (err) => {
        if (err) console.error("[i18n] Init error:", err);

        // Початкова мова: query → LS → navigator
        const initial =
          (langFromQuery && clamp(langFromQuery)) ||
          clamp(safeGetLS(STORAGE_KEY)) ||
          clamp((navigator.languages && navigator.languages[0]) || navigator.language || "pl");

        await changeLanguage(initial, { persist: false });

        // Якщо у користувача є профіль у Supabase — поважаємо user_metadata.lang
        if (window.supabase?.auth?.getSession) {
          try {
            const { data: { session } } = await window.supabase.auth.getSession();
            const userLng = session?.user?.user_metadata?.lang;
            if (isSupported(userLng) && userLng !== i18next.language) {
              await changeLanguage(userLng, { persist: true });
            }
          } catch {}
        }

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

        translateAll();
        setHtmlLang(i18next.language);
        wireLangButtons();
      }
    );

  // --- Public API -----------------------------------------------------------
  window.i18n = {
    t: (k, opts) => i18next.t(k, opts),
    getLang: () => i18next.language,
    setLang: (lng, opts) =>
      changeLanguage(lng, { persist: true, syncSupabase: true, ...(opts || {}) }),
    onChange: (cb) =>
      document.addEventListener(EVENT_LANG_CHANGED, (e) => cb && cb(e.detail.lang)),
  };
})();
