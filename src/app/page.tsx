// app/page.tsx
"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  // WOW-reveal з IntersectionObserver (як у старій версії)
  useEffect(() => {
    const el = document.getElementById("wowBlock");
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.remove("translate-y-10", "opacity-0");
            el.classList.add("translate-y-0", "opacity-100");
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Header />
      <AudioDialog />
      <StickyHelp />

      {/* HERO */}
      <section className="bg-gradient-to-r from-pink-100 via-yellow-100 to-blue-100 py-16 sm:py-20 px-2 md:px-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto z-10 relative">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">
            HappyDate — ciepły asystent, który przypomina o ważnych chwilach i pomaga
            wybrać prezenty prosto z serca 💛
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-8">
            Zatrzymaj czas, spraw komuś niespodziankę i zobacz łzy radości...
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 min-w-0">
            <Link
              href="/generator"
              className="px-6 py-3 bg-pink-500 text-white rounded-xl text-lg font-semibold shadow-md hover:bg-pink-600 hover:scale-105 hover:shadow-xl focus:bg-pink-600 focus:scale-105 focus:shadow-xl active:scale-95 transition-all duration-200 focus:ring-2 focus:ring-pink-400 w-full sm:w-auto"
              aria-label="Znajdź prezent"
            >
              Znajdź prezent <span className="inline-block animate-bounce ml-1">🎁</span>
            </Link>
            <Link
              href="/moje-wydarzenia"
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-xl text-lg font-semibold shadow-md hover:bg-yellow-500 hover:scale-105 hover:shadow-xl focus:bg-yellow-500 focus:scale-105 focus:shadow-xl active:scale-95 transition-all duration-200 focus:ring-2 focus:ring-yellow-300 w-full sm:w-auto"
              aria-label="Dodaj wydarzenie"
            >
              Dodaj wydarzenie <span className="inline-block animate-bounce ml-1">📅</span>
            </Link>
          </div>
        </div>

        {/* dekor */}
        <div className="absolute animate-pulse text-pink-400 text-2xl sm:text-3xl top-4 sm:top-10 left-4 sm:left-10 select-none">
          💖
        </div>
        <div className="absolute animate-ping text-yellow-400 text-xl sm:text-2xl top-24 sm:top-32 right-4 sm:right-12 select-none">
          ✨
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="wowBlock"
        className="transition-all duration-700 ease-in-out translate-y-10 opacity-0 py-16 bg-white dark:bg-gray-900"
        aria-label="Jak to działa?"
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

      {/* ADVANTAGES */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800" aria-label="Dlaczego HappyDate?">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-semibold text-center mb-12">Dlaczego HappyDate?</h3>
          <div className="space-y-10 md:space-y-8">
            <AdvItem icon="🤖" title="AI — Inteligentny dobór prezentów">
              Nasz AI pomoże Ci wybrać idealny prezent, uwzględniając preferencje obdarowanej osoby.
            </AdvItem>
            <AdvItem icon="🔐" title="Anonimowość i bezpieczeństwo">
              Twoje dane są bezpieczne. Gwarantujemy pełną anonimowość.
            </AdvItem>
            <AdvItem icon="🚚" title="Wygodna dostawa na czas">
              Prezent dotrze dokładnie wtedy, kiedy powinien — bez stresu.
            </AdvItem>
            <AdvItem icon="❤️" title="Emocje na pierwszym miejscu">
              HappyDate to więcej niż prezent — to chwila, wspomnienie i miłość.
            </AdvItem>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-white dark:bg-gray-900 py-16" aria-label="Opinie użytkowników">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-10">Opinie naszych użytkowników 💬</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <Review text="🎁 “Dzięki HappyDate nie zapomniałem o urodzinach żony. Prezent był strzałem w dziesiątkę!”" author="— Adam, Warszawa" />
            <Review text="💌 “Zgodziłam się z siostrą po latach — prezent z HappyDate to był przełom!”" author="— Kasia, Gdańsk" />
            <Review text="🌟 “Dostałam kwiaty i voucher w dzień Mamy — dokładnie tak, jak marzyłam.”" author="— Ola, Kraków" />
          </div>
        </div>
      </section>

      {/* GIFTS */}
      <section className="bg-gray-100 dark:bg-gray-800 py-20 pb-12" aria-label="Galeria przykładowych prezentów">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-semibold text-center mb-12">🎁 Przykładowe prezenty</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 min-w-0">
            {[
              { src: "/img/money.png", alt: "Zestaw prezentowy — przykład 1", text: "Zestaw SPA + kartka „Kocham Cię”" },
              { src: "/img/11.png", alt: "Zestaw prezentowy — przykład 2", text: "Kwiaty + list z przeprosinami" },
              { src: "/img/11.png", alt: "Zestaw prezentowy — przykład 3", text: "Box z niespodzianką + voucher" },
              { src: "/img/money.png", alt: "Zestaw prezentowy — przykład 4", text: "Voucher na masaż i kolację" },
            ].map((g) => (
              <div key={g.alt} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow text-center group hover:shadow-xl transition-shadow">
                {/* Якщо будуть великі зображення — краще <Image> з width/height */}
                <img src={g.src} alt={g.alt} className="rounded mb-3 w-full h-40 object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                <p className="font-medium">{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* ───────── helpers ───────── */
function Header() {
  return (
    <header
      className="bg-gradient-to-r from-blue-400 to-cyan-400 py-3 sm:py-4 shadow-none sticky top-0 z-50"
      aria-label="Główna nawigacja"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-bold hover:underline text-white">🎁 HappyDate</Link>
            <span className="hidden md:inline ml-2 text-base italic text-white/90">Twój ciepły asystent prezentowy</span>
            <button
              className="text-white text-2xl p-2 rounded hover:bg-white/10 transition focus:ring-2 focus:ring-cyan-300"
              aria-label="Audio prezentacja"
              type="button"
              onClick={() => (document.getElementById("audioModal") as HTMLDialogElement)?.showModal()}
            >
              ✨
            </button>
          </div>
          <nav className="hidden sm:block mt-0 text-white" aria-label="Menu desktop">
            <div className="flex gap-4 md:gap-6 items-center">
              <Link href="/" className="px-1 py-0.5 rounded bg-white/20 underline font-semibold">Strona główna</Link>
              <Link href="/uslugi" className="px-1 py-0.5 rounded hover:bg-white/20">Usługi</Link>
              <Link href="/moje-wydarzenia" className="px-1 py-0.5 rounded hover:bg-white/20">Moje wydarzenia</Link>
              <Link href="/partnerstwo" className="px-1 py-0.5 rounded hover:bg-white/20">Partnerstwo</Link>
              <Link href="/o-nas" className="px-1 py-0.5 rounded hover:bg-white/20">O nas</Link>
              <Link href="/opinie" className="px-1 py-0.5 rounded hover:bg-white/20">Opinie</Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

function AudioDialog() {
  return (
    <dialog id="audioModal" className="rounded-2xl shadow-lg p-0 w-full max-w-md">
      <form method="dialog" className="p-6 bg-white dark:bg-gray-800 flex flex-col gap-4">
        <h3 className="text-lg font-bold">Krótka zapowiedź</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Ciepło, emocje i prezenty — odkryj HappyDate w 30 секунд 💛
        </p>
        <audio controls className="w-full">
          <source src="/audio/ElevenLabs_2025-04-09T21_13_18_Adam_pre_sp117_s16_sb13_se100_b_m2.mp3" type="audio/mpeg" />
          Twoja przeglądarka не wspiera audio.
        </audio>
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-lg border" aria-label="Zamknij okno audio">Zamknij</button>
        </div>
      </form>
    </dialog>
  );
}

function StickyHelp() {
  return (
    <div className="fixed bottom-6 left-6 z-50" aria-label="Szybki kontakt">
      <div className="relative">
        <button
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full p-4 shadow-xl text-xl transition focus:ring-2 focus:ring-blue-300"
          aria-label="Szybki kontakt telefoniczny lub mailowy"
          onClick={() => {
            const el = document.getElementById("helpPopup");
            if (el) el.classList.toggle("hidden");
          }}
          type="button"
        >
          📞
        </button>

        <div
          id="helpPopup"
          className="hidden absolute left-16 bottom-0 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm w-64 animate-fade-in z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Pomoc"
        >
          <p className="text-gray-800 font-semibold mb-1">Potrzebujesz pomocy?</p>
          <p><a href="tel:+48123123123" className="text-blue-600 hover:underline" aria-label="Zadzwoń do nas">📱 +48 123 123 123</a></p>
          <p><a href="mailto:happyddate@gmail.com" className="text-blue-600 hover:underline" aria-label="Napisz do nas">📩 happyddate@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}

function AdvItem({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
        <span>{icon}</span> <span>{title}</span>
      </h4>
      <p className="text-gray-700 dark:text-gray-300">{children}</p>
    </div>
  );
}

function Review({ text, author }: { text: string; author: string }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow">
      <p>{text}</p>
      <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">{author}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-blue-500 text-white py-6 mt-12" aria-label="Stopka HappyDate">
      <div className="max-w-4xl mx-auto text-center px-4 text-sm md:text-base">
        &copy; {new Date().getFullYear()} HappyDate. Z miłością tworzymy niezapomniane chwile.<br />
        <span className="text-xs opacity-80">
          Projekt & UX: HappyDate Team | <Link href="/polityka-prywatnosci" className="underline hover:text-yellow-200">Polityka prywatności</Link>
        </span>
      </div>
    </footer>
  );
}
