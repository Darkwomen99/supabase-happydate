// src/app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { Metadata } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// SEO / OpenGraph (app router)


// ─────────────────────────────────────────────────────────────────────────────
// Допоміжні типи
type SupabaseUser = {
  email?: string | null;
  user_metadata?: Record<string, any>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Невеликі допоміжники
const cn = (...cls: Array<string | false | undefined>) => cls.filter(Boolean).join(" ");

function useI18nInit() {
  // ініціалізація i18next з CDN (так само як у старій версії)
  useEffect(() => {
    const supported = ["pl", "ua", "en", "ru", "de"] as const;
    const browser = (typeof navigator !== "undefined" && navigator.language?.slice(0, 2)) || "pl";
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) || browser;
    const initial = (supported as readonly string[]).includes(stored) ? stored : "pl";

    // коли скрипти з CDN підвантажаться, у window буде i18next/i18nextHttpBackend
    const tryInit = () => {
      const w = window as any;
      if (!w.i18next || !w.i18nextHttpBackend) return;

      w.i18next
        .use(w.i18nextHttpBackend)
        .init(
          {
            lng: initial,
            fallbackLng: "pl",
            backend: { loadPath: `/i18n/{{lng}}.json` },
          },
          (_: any, t: (k: string) => string) => {
            document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
              const key = el.getAttribute("data-i18n");
              if (key && w.i18next.exists(key)) el.innerHTML = t(key);
            });
          }
        );
    };

    // спробувати ініт після завантаження скриптів
    const id = window.setInterval(() => {
      tryInit();
    }, 200);

    // одноразово також спробуємо ініт через 1.2с
    const timeout = window.setTimeout(tryInit, 1200);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Компоненти

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const linkCls =
    "px-2 py-1 rounded hover:bg-white/20 focus:bg-white/20 transition whitespace-nowrap";
  return (
    <>
      <Link href="/" className={linkCls} onClick={onNavigate} data-i18n="header.home">
        Strona główna
      </Link>
      <Link href="/services" className={linkCls} onClick={onNavigate} data-i18n="header.services">
        Usługi
      </Link>
      <Link href="/dashboard" className={linkCls} onClick={onNavigate} data-i18n="header.dashboard">
        Moje wydarzenia
      </Link>
      <Link href="/partnerstwo" className={linkCls} onClick={onNavigate} data-i18n="header.partner">
        Partnerstwo
      </Link>
      <Link href="/about" className={linkCls} onClick={onNavigate} data-i18n="header.about">
        O nas
      </Link>
      <Link href="/reviews" className={linkCls} onClick={onNavigate} data-i18n="header.reviews">
        Opinie
      </Link>
    </>
  );
}

function LangDropdown() {
  const [open, setOpen] = useState(false);
  const [flag, setFlag] = useState("🌐");
  const refWrap = useRef<HTMLDivElement | null>(null);
  const map: Record<string, string> = { pl: "🇵🇱", ua: "🇺🇦", en: "🇬🇧", ru: "🇷🇺", de: "🇩🇪" };

  const getLang = () => {
    const raw =
      (typeof window !== "undefined" && localStorage.getItem("lang")) ||
      (typeof navigator !== "undefined" && navigator.language?.slice(0, 2)) ||
      "pl";
    return raw && map[raw] ? raw : "pl";
  };

  useEffect(() => {
    setFlag(map[getLang()]);
    const onDoc = (e: MouseEvent) => {
      if (!refWrap.current) return;
      if (!refWrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (lang: string) => {
    localStorage.setItem("lang", lang);
    setFlag(map[lang] || "🌐");
    // якщо є i18next — міняємо мову «на льоту», інакше перезавантажимо
    const w = window as any;
    if (w.i18next?.changeLanguage) {
      w.i18next.changeLanguage(lang).then(() => {
        document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (key && w.i18next.exists(key)) el.innerHTML = w.i18next.t(key);
        });
      });
    } else {
      location.reload();
    }
    setOpen(false);
  };

  const item =
    "flex items-center gap-2 w-full px-4 py-3 text-base hover:bg-blue-100 transition text-left";

  return (
    <div className="relative" ref={refWrap}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded border bg-white/10 text-white hover:bg-white/20 transition focus:ring-2 focus:ring-blue-300"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="langDropdown"
        type="button"
      >
        <span aria-hidden>{flag}</span>
        <svg className={cn("w-4 h-4 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        id="langDropdown"
        className={cn(
          "absolute right-0 mt-2 bg-white shadow-xl rounded-xl z-50 py-2 min-w-[160px] text-left transition-all duration-200 origin-top-right",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
        role="menu"
      >
        <button className={item} onClick={() => setLang("pl")} role="menuitem">
          <span>🇵🇱</span> Polski
        </button>
        <button className={item} onClick={() => setLang("ua")} role="menuitem">
          <span>🇺🇦</span> Українська
        </button>
        <button className={item} onClick={() => setLang("en")} role="menuitem">
          <span>🇬🇧</span> English
        </button>
        <button className={item} onClick={() => setLang("ru")} role="menuitem">
          <span>🇷🇺</span> Русский
        </button>
        <button className={item} onClick={() => setLang("de")} role="menuitem">
          <span>🇩🇪</span> Deutsch
        </button>
      </div>
    </div>
  );
}

function AudioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // використовуємо простий overlay, щоб не залежати від <dialog>
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Krótka zapowiedź"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-1">Krótka zapowiedź</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Ciepło, emocje i prezenty — odkryj HappyDate w 30 sekund 💛
        </p>
        <audio controls className="w-full mb-4">
          <source src="/audio/ElevenLabs_2025-04-09T21_13_18.mp3" type="audio/mpeg" />
          Twoja przeglądarka nie wspiera audio.
        </audio>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            aria-label="Zamknij okno audio"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpPopup() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 left-6 z-50" aria-label="Szybki kontakt">
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full p-4 shadow-xl text-xl transition duration-300 ease-in-out focus:ring-2 focus:ring-blue-300"
          aria-controls="helpPopup"
          aria-expanded={open}
          aria-label="Szybki kontakt telefoniczny lub mailowy"
          type="button"
        >
          📞
        </button>

        {open && (
          <div
            id="helpPopup"
            className="absolute left-16 bottom-0 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm w-64 animate-[fade-in_0.3s_ease-out] z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Pomoc"
          >
            <p className="text-gray-800 font-semibold mb-1">Potrzebujesz pomocy?</p>
            <p>
              <a href="tel:+48123123123" className="text-blue-600 hover:underline" aria-label="Zadzwoń do nas">
                📱 +48 123 123 123
              </a>
            </p>
            <p>
              <a href="mailto:happyddate@gmail.com" className="text-blue-600 hover:underline" aria-label="Napisz do nas">
                📩 happyddate@gmail.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState<Array<{ who: "user" | "bot"; text: string }>>([
    { who: "bot", text: "Cześć! Jak mogę Ci pomóc znaleźć idealny prezent? 🎁" },
  ]);

  function send() {
    const text = msg.trim();
    if (!text) return;
    setItems((prev) => [...prev, { who: "user", text }]);
    setMsg("");
    setTimeout(() => {
      setItems((prev) => [...prev, { who: "bot", text: "Świetny wybór! 🎁 Masz jeszcze inne pytania?" }]);
    }, 500);
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50" aria-label="Otwórz chatbota HappyBot">
        <button
          onClick={() => setOpen((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 focus:ring-2 focus:ring-blue-300"
          aria-controls="chatbot-window"
          aria-expanded={open}
          aria-label="Wyślij pytanie do HappyBot"
          type="button"
        >
          💬
        </button>
      </div>

      {open && (
        <div
          id="chatbot-window"
          className="fixed bottom-20 right-6 w-80 max-w-full bg-white dark:bg-gray-800 border rounded-xl shadow-2xl z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Chatbot HappyBot"
        >
          <div className="bg-blue-600 text-white p-4 font-semibold">🤖 HappyBot — Twój doradca prezentowy</div>
          <div className="p-4 text-sm h-64 overflow-y-auto" id="chat-content">
            {items.map((it, i) => (
              <p
                key={i}
                className={cn(
                  "mt-2",
                  it.who === "user" ? "text-right text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
                )}
              >
                <strong>{it.who === "user" ? "Ty: " : "HappyBot: "}</strong>
                <span>{it.text}</span>
              </p>
            ))}
          </div>
          <div className="p-2 border-t flex items-center bg-gray-50 dark:bg-gray-700">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 p-2 text-sm rounded-l border border-gray-300 dark:bg-gray-800 dark:text-white"
              placeholder="Zadaj pytanie..."
              aria-label="Twoja wiadomość"
            />
            <button onClick={send} className="bg-blue-500 text-white px-3 py-2 rounded-r" type="button">
              Wyślij
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CookiesBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("happydate_cookie_consent") !== "true") setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div
      id="cookieConsent"
      className="fixed bottom-0 inset-x-0 bg-gray-800 bg-opacity-90 text-white py-4 px-6 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Informacja o plikach cookies"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm md:text-base" data-i18n="cookies.text">
          Ta strona używa plików cookies, by ulepszyć Twój komfort. Korzystając dalej z serwisu, akceptujesz naszą{" "}
          <Link href="/privacy" className="underline hover:text-blue-300" target="_blank">
            Politykę Prywatności
          </Link>
          .
        </p>
        <button
          id="acceptCookies"
          onClick={() => {
            localStorage.setItem("happydate_cookie_consent", "true");
            setShow(false);
          }}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md font-semibold transition focus:ring-2 focus:ring-blue-400"
          aria-label="Akceptuję cookies"
        >
          <span data-i18n="cookies.accept">Akceptuję</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Головна сторінка
export default function HomePage() {
  useI18nInit();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const wowRef = useRef<HTMLDivElement | null>(null);

  // Supabase auth → показати аватар/вихід якщо є сесія
  useEffect(() => {
    let unsub: any;
    (async () => {
      try {
        const mod = await import("@/lib/supabaseClient").catch(() => null);
        const supabase = (mod as any)?.supabase;
        if (!supabase?.auth) return;

        const { data } = await supabase.auth.getUser();
        const u: SupabaseUser | null = (data?.user as any) || null;
        setUser(u);

        unsub = supabase.auth.onAuthStateChange((_event: any, session: any) => {
          setUser(session?.user || null);
        });
      } catch {
        // безпечний fallback — просто ховаємо UI користувача
      }
    })();

    return () => {
      if (typeof unsub?.subscription?.unsubscribe === "function") {
        unsub.subscription.unsubscribe();
      } else if (typeof unsub === "function") {
        unsub();
      }
    };
  }, []);

  // AOS reveal для блоку "Jak to działa?"
useEffect(() => {
  const el = wowRef.current;
  if (!el) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.remove("translate-y-10", "opacity-0");
          target.classList.add("translate-y-0", "opacity-100");
          io.unobserve(entry.target); // ✅ коректно
        }
      });
    },
    { threshold: 0.3 }
  );

  io.observe(el);
  return () => io.disconnect();
}, []);


  const onSignOut = async () => {
    try {
      const mod = await import("@/lib/supabaseClient").catch(() => null);
      const supabase = (mod as any)?.supabase;
      await supabase?.auth?.signOut?.();
      setUser(null);
      window.location.href = "/";
    } catch {
      // ignore
    }
  };

  const avatarUrl =
    (user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "/img/11.png")?.trim?.() ||
    "/img/11.png";

  return (
    <>
      {/* CDN: Tailwind уже підключено глобально у тебе, але на випадок окремого рендеру AOS+i18n додамо тут */}
      <Script id="aos-css" strategy="afterInteractive">{`
        (function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/aos@2.3.4/dist/aos.css';document.head.appendChild(l);}());
      `}</Script>
      <Script src="https://unpkg.com/i18next@21.6.14/i18next.min.js" strategy="afterInteractive" />
      <Script src="https://unpkg.com/i18next-http-backend@1.4.1/i18nextHttpBackend.min.js" strategy="afterInteractive" />
      <Script
        src="https://unpkg.com/aos@2.3.4/dist/aos.js"
        strategy="afterInteractive"
        onLoad={() => {
          // ініціалізація AOS
          if (typeof (window as any).AOS !== "undefined") {
            (window as any).AOS.init({ duration: 700, once: true, offset: 60 });
          }
        }}
      />

      {/* Header */}
      <header
        id="mainHeader"
        className="bg-gradient-to-r from-blue-400 to-cyan-400 py-3 sm:py-4 shadow-none sticky top-0 z-50 transition-shadow duration-300"
        aria-label="Główna nawigacja"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                id="logo-link"
                className="text-2xl font-bold hover:underline text-white"
                aria-label="HappyDate - prezentowy asystent"
              >
                🎁 HappyDate
              </Link>
              <span className="hidden md:inline ml-2 text-base italic text-white/90" data-i18n="header.tagline">
                Twój ciepły asystent prezentowy
              </span>

              {/* Audio button */}
              <button
                id="audioBtn"
                title="Posłuchaj nas"
                onClick={() => setAudioOpen(true)}
                className="text-white text-2xl p-2 rounded hover:bg-white/10 transition focus:ring-2 focus:ring-cyan-300"
                aria-label="Audio prezentacja"
                type="button"
              >
                ✨
              </button>
            </div>

            {/* RIGHT: Lang + Auth + burger */}
            <div className="flex items-center gap-3">
              {/* Language dropdown */}
              <LangDropdown />

              {/* Auth shortcuts (desktop) */}
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-xl bg-white text-blue-700 font-semibold text-sm transition hover:bg-blue-50"
                    id="login-link"
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-semibold text-sm transition hover:bg-white/20"
                    id="register-link"
                  >
                    Rejestracja
                  </Link>
                </>
              )}

              {user && (
                <>
                  <Link href="/profile" id="user-avatar-link" aria-label="Mój profil">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl}
                      alt={user?.user_metadata?.full_name || user?.email || "Profil użytkownika"}
                      className="w-10 h-10 rounded-full border-2 border-white shadow cursor-pointer hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <button
                    onClick={onSignOut}
                    id="logout-btn"
                    className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-300"
                    aria-label="Wyloguj się"
                    type="button"
                  >
                    Wyloguj się
                  </button>
                </>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="text-white text-3xl sm:hidden p-2 rounded hover:bg-white/10 focus:ring-2 focus:ring-cyan-300 transition"
                aria-label="Menu"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
                type="button"
              >
                ☰
              </button>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:block mt-4 text-white" id="desktop-menu" aria-label="Menu desktop">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-4 md:gap-6 items-center">
                <NavLinks />
              </div>
            </div>
          </nav>

          {/* Mobile nav */}
          {mobileOpen && (
            <div id="mobile-menu" className="sm:hidden mt-4 text-white space-y-3">
              <div className="flex flex-col gap-2">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              {/* Simple language row (mobile) */}
              <div className="flex gap-2 mt-4 flex-wrap" aria-label="Zmiana języka">
                {[
                  { code: "pl", flag: "🇵🇱" },
                  { code: "ua", flag: "🇺🇦" },
                  { code: "en", flag: "🇬🇧" },
                  { code: "ru", flag: "🇷🇺" },
                  { code: "de", flag: "🇩🇪" },
                ].map((l) => (
                  <button
                    key={l.code}
                    className="px-2 py-1 rounded border focus:ring-2 focus:ring-pink-400"
                    onClick={() => {
                      localStorage.setItem("lang", l.code);
                      const w = window as any;
                      if (w.i18next?.changeLanguage) {
                        w.i18next.changeLanguage(l.code).then(() => {
                          document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
                            const key = el.getAttribute("data-i18n");
                            if (key && w.i18next.exists(key)) el.innerHTML = w.i18next.t(key);
                          });
                        });
                      } else {
                        location.reload();
                      }
                      setMobileOpen(false);
                    }}
                    aria-label={l.code}
                    type="button"
                  >
                    {l.flag}
                  </button>
                ))}
              </div>

              {/* Auth mobile */}
              <div id="auth-buttons-mobile" className="flex flex-col gap-2 mt-3">
                {!user ? (
                  <>
                    <Link
                      href="/register"
                      className="px-3 py-1 rounded bg-white text-blue-600 font-semibold text-center transition hover:bg-blue-100"
                      id="register-link-mobile"
                      onClick={() => setMobileOpen(false)}
                    >
                      Rejestracja
                    </Link>
                    <Link
                      href="/login"
                      className="px-3 py-1 rounded bg-white text-blue-600 font-semibold text-center transition hover:bg-blue-100"
                      id="login-link-mobile"
                      onClick={() => setMobileOpen(false)}
                    >
                      Zaloguj się
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      className="px-3 py-1 rounded bg-green-600 text-white font-semibold text-center transition hover:bg-green-700"
                      id="dashboard-link-mobile"
                      onClick={() => setMobileOpen(false)}
                    >
                      Panel użytkownika
                    </Link>
                    <button
                      id="logout-btn-mobile"
                      className="px-3 py-1 rounded bg-red-600 text-white font-semibold text-center transition hover:bg-red-700"
                      type="button"
                      onClick={() => {
                        onSignOut();
                        setMobileOpen(false);
                      }}
                    >
                      Wyloguj się
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sticky help icon */}
      <HelpPopup />

      {/* HERO */}
      <section className="bg-gradient-to-r from-pink-100 via-yellow-100 to-blue-100 py-16 sm:py-20 px-2 md:px-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto z-10 relative" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight" data-i18n="hero.title">
            HappyDate — ciepły asystent, który przypomina o ważnych chwilach i pomaga wybrać prezenty prosto z serca 💛
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-8" data-i18n="hero.description">
            Zatrzymaj czas, spraw komuś niespodziankę i zobacz łzy radości...
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 min-w-0">
            <Link
              href="/generator"
              className="px-6 py-3 bg-pink-500 text-white rounded-xl text-lg font-semibold shadow-md hover:bg-pink-600 hover:scale-105 hover:shadow-xl focus:bg-pink-600 focus:scale-105 focus:shadow-xl active:scale-95 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-pink-400 w-full sm:w-auto"
              data-i18n="hero.ctaFind"
              aria-label="Znajdź prezent"
            >
              Znajdź prezent <span className="inline-block animate-bounce ml-1">🎁</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-xl text-lg font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 hover:shadow-xl focus:bg-yellow-500 focus:scale-105 focus:shadow-xl active:scale-95 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-yellow-300 w-full sm:w-auto"
              data-i18n="hero.ctaAdd"
              aria-label="Dodaj wydarzenie"
            >
              Dodaj wydarzenie <span className="inline-block animate-bounce ml-1">📅</span>
            </Link>
          </div>
        </div>

        {/* dekor */}
        <div
          className="absolute animate-pulse text-pink-400 text-2xl sm:text-3xl top-4 sm:top-10 left-4 sm:left-10 pointer-events-none select-none"
          aria-hidden="true"
        >
          💖
        </div>
        <div
          className="absolute animate-ping text-yellow-400 text-xl sm:text-2xl top-24 sm:top-32 right-4 sm:right-12 pointer-events-none select-none"
          aria-hidden="true"
        >
          ✨
        </div>
      </section>

      {/* How it works */}
      <section
        ref={wowRef}
        id="wowBlock"
        className="transition-all duration-700 ease-in-out translate-y-10 opacity-0 py-16 bg-white dark:bg-gray-900"
        aria-label="Jak to działa?"
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-2xl font-semibold mb-10" data-i18n="howItWorks.title">
            Jak to działa?
          </h3>
          <div className="grid sm:grid-cols-3 gap-8">
            <div data-aos="zoom-in" data-aos-delay="0">
              <span className="block text-3xl mb-2 font-extrabold text-blue-400">1</span>
              <p data-i18n="howItWorks.step1">Dodajesz wydarzenie do kalendarza</p>
            </div>
            <div data-aos="zoom-in" data-aos-delay="100">
              <span className="block text-3xl mb-2 font-extrabold text-pink-400">2</span>
              <p data-i18n="howItWorks.step2">Wypełniasz szczegóły i preferencje</p>
            </div>
            <div data-aos="zoom-in" data-aos-delay="200">
              <span className="block text-3xl mb-2 font-extrabold text-yellow-400">3</span>
              <p data-i18n="howItWorks.step3">My zajmujemy się resztą ❤️</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800" aria-label="Dlaczego HappyDate?">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-semibold text-center mb-12" data-i18n="advantages.title">
            Dlaczego HappyDate?
          </h3>
          <div className="space-y-10 md:space-y-8">
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2" data-i18n="advantages.ai">
                <span>🤖</span> <span>AI — Inteligentny dobór prezentów</span>
              </h4>
              <p className="text-gray-700 dark:text-gray-300" data-i18n="advantages.aiDesc">
                Nasz AI pomoże Ci wybrać idealny prezent, uwzględniając preferencje obdarowanej osoby.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2" data-i18n="advantages.privacy">
                <span>🔐</span> <span>Anonimowość i bezpieczeństwo</span>
              </h4>
              <p className="text-gray-700 dark:text-gray-300" data-i18n="advantages.privacyDesc">
                Twoje dane są bezpieczne. Gwarantujemy pełną anonimowość.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2" data-i18n="advantages.delivery">
                <span>🚚</span> <span>Wygodna dostawa na czas</span>
              </h4>
              <p className="text-gray-700 dark:text-gray-300" data-i18n="advantages.deliveryDesc">
                Prezent dotrze dokładnie wtedy, kiedy powinien — bez stresu.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2" data-i18n="advantages.emotions">
                <span>❤️</span> <span>Emocje na pierwszym miejscu</span>
              </h4>
              <p className="text-gray-700 dark:text-gray-300" data-i18n="advantages.emotionsDesc">
                HappyDate to więcej niż prezent — to chwila, wspomnienie i miłość.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white dark:bg-gray-900 py-16" aria-label="Opinie użytkowników">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-10" data-i18n="reviews.title">
            Opinie naszych użytkowników 💬
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
              <p data-i18n="reviews.adam.text">
                🎁 “Dzięki HappyDate nie zapomniałem o urodzinach żony. Prezent był strzałem w dziesiątkę!”
              </p>
              <p className="text-sm mt-3 text-gray-600 dark:text-gray-400" data-i18n="reviews.adam.author">
                — Adam, Warszawa
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
              <p data-i18n="reviews.kasia.text">
                💌 “Zgodziłam się z siostrą po latach — prezent z HappyDate to był przełom!”
              </p>
              <p className="text-sm mt-3 text-gray-600 dark:text-gray-400" data-i18n="reviews.kasia.author">
                — Kasia, Gdańsk
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
              <p data-i18n="reviews.ola.text">
                🌟 “Dostałam kwiaty i voucher w dzień Mamy — dokładnie tak, jak marzyłam.”
              </p>
              <p className="text-sm mt-3 text-gray-600 dark:text-gray-400" data-i18n="reviews.ola.author">
                — Ola, Kraków
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gifts */}
      <section className="bg-gray-100 dark:bg-gray-800 py-20 pb-12" aria-label="Galeria przykładowych prezentów">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-semibold text-center mb-12" data-i18n="gifts.title">
            🎁 Przykładowe prezenty
          </h3>
          {/* Зображення повинні лежати в /public/img */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 min-w-0">
            {[
              { src: "/img/money.png", label: "Zestaw SPA + kartka „Kocham Cię”", key: "gifts.romantic" },
              { src: "/img/11.png", label: "Kwiaty + list z przeprosinami", key: "gifts.flowers" },
              { src: "/img/11.png", label: "Box z niespodzianką + voucher", key: "gifts.box" },
              { src: "/img/money.png", label: "Voucher na masaż i kolację", key: "gifts.voucher" },
            ].map((g, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow text-center group hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative w-full h-40 mb-3 overflow-hidden rounded">
                  <Image
                    src={g.src}
                    alt={g.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="font-medium" data-i18n={g.key}>
                  {g.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-500 text-white py-6 mt-12" aria-label="Stopka HappyDate">
        <div className="max-w-4xl mx-auto text-center px-4 text-sm md:text-base" data-i18n="footer.text">
          &copy; 2025 HappyDate. Z miłością tworzymy niezapomniane chwile.
          <br />
          <span className="text-xs opacity-80">
            Projekt &amp; UX: HappyDate Team |{" "}
            <Link href="/privacy" className="underline hover:text-yellow-200">
              Polityka prywatności
            </Link>
          </span>
        </div>
      </footer>

      {/* Модалі, чат і cookies */}
      <AudioModal open={audioOpen} onClose={() => setAudioOpen(false)} />
      <Chatbot />
      <CookiesBar />

      {/* Дрібні анімації з CSS (безпечно прямо тут) */}
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce,
          .animate-ping,
          .animate-pulse {
            animation: none !important;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
