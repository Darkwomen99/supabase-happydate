// lib/site.ts

/**
 * Єдине джерело правди щодо базового URL сайту.
 * Порядок пріоритетів:
 * 1) NEXT_PUBLIC_SITE_URL (рекомендовано задати у Vercel для Preview/Production)
 * 2) VERCEL_URL (доступний на сервері; доповнюємо протоколом https://)
 * 3) http://localhost:3000 (локальна розробка)
 */

const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelUrl = process.env.VERCEL_URL?.trim();

/** Додаємо протокол, якщо його немає, і прибираємо трейлінг-слеші */
function normalizeUrl(url: string): string {
  const withProtocol = url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
  return withProtocol.replace(/\/+$/, "");
}

/** Канонічний origin проєкту (без фінального слеша) */
export const siteUrl: string =
  (envUrl && normalizeUrl(envUrl)) ||
  (vercelUrl && normalizeUrl(vercelUrl)) ||
  "http://localhost:3000";

/** Зручно для перевірок середовища */
export const isProd = process.env.VERCEL_ENV === "production";
export const isPreview = process.env.VERCEL_ENV === "preview";
export const isDev = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "development";

/**
 * Побудувати абсолютний URL з відносного шляху.
 * Приклад: absoluteUrl("/kontakt") -> "https://example.com/kontakt"
 */
export function absoluteUrl(path: string = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${clean}`;
}

/** Хост (домен) — інколи зручно для метаданих або cookie домену */
export const siteHost = (() => {
  try {
    return new URL(siteUrl).host;
  } catch {
    return "localhost:3000";
  }
})();
