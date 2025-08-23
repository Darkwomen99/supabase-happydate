// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HappyDate - Nie zapomnij o ważnych chwilach",
    template: "%s | HappyDate",
  },
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
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "HappyDate - Magiczne prezenty na każdą okazję",
    description:
      "Zaskocz bliskich wyjątkowymi prezentami i nie zapomnij o ważnych chwilach!",
    images: [{ url: "/img/11.png" }], // заміни на свій банер за потреби
  },
  twitter: {
    card: "summary_large_image",
    title: "HappyDate - Magiczne prezenty na każdą okazję",
    description:
      "Zaskocz bliskich wyjątkowymi prezentami i nie zapomnij o ważnych chwilach!",
    images: ["/img/11.png"],
  },
  icons: {
    icon: [{ url: "/img/11.png", sizes: "32x32", type: "image/png" }],
    apple: "/img/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pl"
      className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors"
    >
      <body className="overflow-x-hidden">{children}</body>
    </html>
  );
}
