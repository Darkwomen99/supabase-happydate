// src/app/page.tsx
"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  // Легкий аналог AOS/IntersectionObserver
  useEffect(() => {
    const el = document.getElementById("wowBlock");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.remove("translate-y-10", "opacity-0");
            el.classList.add("translate-y-0", "opacity-100");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Header */}
      <header
        id="mainHeader"
        className="bg-gradient-to-r from-blue-400 to-cyan-400 py-3 sm:py-4 sticky top-0 z-50"
        aria-label="Główna nawigacja"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <a
                href="/"
                id="logo-link"
                className="text-2xl font-bold hover:underline text-white"
                aria-label="HappyDate - prezentowy asystent"
              >
                🎁 HappyDate
              </a>
              <span className="hidden md:inline ml-2 text-base italic text-white/90">
                Twój ciepły asystent prezentowy
              </span>
              <button
                id="audioBtn"
                title="Posłuchaj nas"
                className="text-white text-2xl p-2 rounded hover:bg-white/10 transition focus:ring-2 focus:ring-cyan-300"
                aria-label="Audio prezentacja"
                type="button"
              >
                ✨
              </button>
            </div>

            <button
              id="mobile-menu-toggle"
              className="text-white text-3xl sm:hidden p-2 rounded hover:bg-white/10 focus:ring-2 focus:ring-cyan-300 transition"
              aria-label="Menu"
              type="button"
            >
              ☰
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:block mt-4 text-white" id="desktop-menu" aria-label="Menu desktop">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-4 md:gap-6 items-center">
                <a href="/" className="px-1 py-0.5 rounded bg-white/20 underline font-semibold">
                  Strona główna
                </a>
                <a href="/pages/services.html" className="px-1 py-0.5 rounded hover:bg-white/20 transition">
                  Usługi
                </a>
                <a href="/pages/dashboard.html" className="px-1 py-0.5 rounded hover:bg-white/20 transition">
                  Moje wydarzenia
                </a>
                <a href="/pages/partnerstwo.html" className="px-1 py-0.5 rounded hover:bg-white/20 transition">
                  Partnerstwo
                </a>
                <a href="/pages/about.html" className="px-1 py-0.5 rounded hover:bg-white/20 transition">
                  O nas
                </a>
                <a href="/pages/reviews.html" className="px-1 py-0.5 rounded hover:bg-white/20 transition">
                  Opinie
                </a>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                <a
                  href="/pages/login.html"
                  className="px-3 py-1.5 rounded-xl bg-white text-blue-700 font-semibold text-sm transition hover:bg-blue-50"
                >
                  Zaloguj się
                </a>
                <a
                  href="/pages/register.html"
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-semibold text-sm transition hover:bg-white/20"
                >
                  Rejestracja
                </a>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-r from-pink-100 via-yellow-100 to-blue-100 py-16 sm:py-20 px-2 md:px-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto z-10 relative">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">
            HappyDate — ciepły asystent, który przypomina o ważnych chwilach i pomaga wybrać prezenty prosto z serca 💛
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-8">
            Zatrzymaj czas, spraw komuś niespodziankę i zobacz łzy radości...
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
            <a
              href="/pages/generator.html"
              className="px-6 py-3 bg-pink-500 text-white rounded-xl text-lg font-semibold shadow-md hover:bg-pink-600 hover:scale-105 focus:ring-2 focus:ring-pink-400 transition"
            >
              Znajdź prezent <span className="inline-block animate-bounce ml-1">🎁</span>
            </a>
            <a
              href="/pages/dashboard.html"
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-xl text-lg font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 focus:ring-2 focus:ring-yellow-300 transition"
            >
              Dodaj wydarzenie <span className="inline-block animate-bounce ml-1">📅</span>
            </a>
          </div>
        </div>
        <div className="absolute animate-pulse text-pink-400 text-2xl sm:text-3xl top-4 left-4">💖</div>
        <div className="absolute animate-ping text-yellow-400 text-xl sm:text-2xl top-24 right-4">✨</div>
      </section>

      {/* How it works */}
      <section
        id="wowBlock"
        className="transition-all duration-700 ease-in-out translate-y-10 opacity-0 py-16 bg-white dark:bg-gray-900"
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-2xl font-semibold mb-10">Jak to działa?</h3>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <span className="block text-3xl mb-2 font-extrabold text-blue-400">1</span>
              <p>Dodajesz wydarzenie do kalendarza</p>
            </div>
            <div>
              <span className="block text-3xl mb-2 font-extrabold text-pink-400">2</span>
              <p>Wypełniasz szczegóły i preferencje</p>
            </div>
            <div>
              <span className="block text-3xl mb-2 font-extrabold text-yellow-400">3</span>
              <p>My zajmujemy się resztą ❤️</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-semibold text-center mb-12">Dlaczego HappyDate?</h3>
          <div className="space-y-10">
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2">🤖 AI — Inteligentny dobór prezentów</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Nasz AI pomoże Ci wybrać idealny prezent, uwzględniając preferencje obdarowanej osoby.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2">🔐 Anonimowość i bezpieczeństwo</h4>
              <p className="text-gray-700 dark:text-gray-300">Twoje dane są bezpieczne. Gwarantujemy pełną anonimowość.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2">🚚 Wygodna dostawa na czas</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Prezent dotrze dokładnie wtedy, kiedy powinien — bez stresu.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 flex items-center gap-2">❤️ Emocje na pierwszym miejscu</h4>
              <p className="text-gray-700 dark:text-gray-300">
                HappyDate to więcej niż prezent — to chwila, wspomnienie i miłość.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-10">Opinie naszych użytkowników 💬</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { text: "🎁 “Dzięki HappyDate nie zapomniałem o urodzinach żony. Prezent był strzałem w dziesiątkę!”", author: "— Adam, Warszawa" },
              { text: "💌 “Zgodziłam się z siostrą po latach — prezent z HappyDate to był przełom!”", author: "— Kasia, Gdańsk" },
              { text: "🌟 “Dostałam kwiaty i voucher w dzień Mamy — dokładnie tak, jak marzyłam.”", author: "— Ola, Kraków" },
            ].map((r, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
                <p>{r.text}</p>
                <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">{r.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gifts */}
      <section className="bg-gray-100 dark:bg-gray-800 py-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-semibold text-center mb-12">🎁 Przykładowe prezenty</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { src: "/img/money.png", label: "Zestaw SPA + kartka „Kocham Cię”" },
              { src: "/img/11.png", label: "Kwiaty + list z przeprosinami" },
              { src: "/img/11.png", label: "Box z niespodzianką + voucher" },
              { src: "/img/money.png", label: "Voucher na masaż i kolację" },
            ].map((g, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow text-center group hover:shadow-xl transition">
                <div className="relative w-full h-40 mb-3 overflow-hidden rounded">
                  <Image src={g.src} alt={g.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <p className="font-medium">{g.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-500 text-white py-6 mt-12">
        <div className="max-w-4xl mx-auto text-center text-sm md:text-base">
          &copy; 2025 HappyDate. Z miłością tworzymy niezapomniane chwile.
          <br />
          <span className="text-xs opacity-80">
            Projekt & UX: HappyDate Team |{" "}
            <a href="/pages/privacy.html" className="underline hover:text-yellow-200">
              Polityka prywatności
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
