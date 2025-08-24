// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

// 🔹 ТУТ metadata (server component)
export const metadata: Metadata = {
  title: "HappyDate - Nie zapomnij o ważnych chwilach",
  description:
    "HappyDate — Twój osobisty asystent prezentowy. Zaplanuj wyjątkowe prezenty z AI i emocjami!",
  keywords: [
    "prezenty",
    "asystent prezentowy",
    "kalendarz prezentów",
    "prezent dla niej",
    "prezent dla niego",
    "AI gifts",
    "prezenty online",
    "HappyDate",
  ],
  robots: { index: true, follow: true },
  authors: [{ name: "HappyDate" }],
  alternates: { canonical: "https://www.happydate.pl/" },
  openGraph: {
    type: "website",
    url: "https://www.happydate.pl/",
    title: "HappyDate - Magiczne prezenty na każdą okazję",
    description:
      "Zaskocz bliskich wyjątkowymi prezentami i nie zapomnij o ważnych chwilach!",
    images: [{ url: "/img/11.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors">
        {children}
      </body>
    </html>
  );
}
