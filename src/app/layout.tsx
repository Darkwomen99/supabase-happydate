import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HappyDate - Nie zapomnij o ważnych chwilach",
  description:
    "HappyDate — Twój osobisty asystent prezentowy. Zaplanuj wyjątkowe prezenty z AI i emocjami!",
  robots: "index, follow",
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
  alternates: { canonical: "https://www.happydate.pl/" },
  openGraph: {
    type: "website",
    url: "https://www.happydate.pl/",
    title: "HappyDate - Magiczne prezenty na każdą okazję",
    description:
      "Zaskocz bliskich wyjątkowymi prezentami i nie zapomnij o ważnych chwilach!",
    images: [{ url: "/img/11.png" }], // ✅ без /public
  },
  icons: [
    { rel: "icon", url: "/img/11.png", sizes: "32x32", type: "image/png" }, // ✅ без /public
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pl"
      className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors"
    >
      <body className="overflow-x-hidden">{children}</body>
    </html>
  );
}
