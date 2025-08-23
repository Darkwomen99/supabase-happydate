// app/sitemap.ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Динамічна карта сайту для Next.js App Router.
 * Домен береться з lib/site.ts (env), тож на preview/production урли будуть коректні.
 * Коли з’являться динамічні сторінки (напр. /uslugi/[...]), додамо їх тут із Supabase.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",                 // головна
    "/o-nas",
    "/uslugi",
    "/opinie",
    "/partnerstwo",
    "/kontakt",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1.0 : 0.7,
  }));

  // TODO: додати динамічні урли з Supabase (послуги, статті і т.д.)
  // const dynamic = (await getServiceSlugs()).map(s => ({
  //   url: `${siteUrl}/uslugi/${s.category}/${s.slug}`,
  //   lastModified: now,
  //   changeFrequency: "weekly",
  //   priority: 0.6,
  // }));

  return [...staticRoutes /*, ...dynamic */];
}
