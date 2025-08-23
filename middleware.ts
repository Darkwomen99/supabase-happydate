// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProd } from "@/lib/site";

/**
 * Для усіх середовищ, крім production, забороняємо індексацію.
 * Це захищає прев’ю-домен *.vercel.app від випадкового індексування.
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  if (!isProd) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

/**
 * Не застосовуємо middleware до статичних ресурсів і службових файлів.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|img|audio).*)",
  ],
};
