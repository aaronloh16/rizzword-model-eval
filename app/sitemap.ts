import type { MetadataRoute } from "next";
import { allPuzzles, getRace } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const days = allPuzzles();
  const latest = days.at(-1)?.id;
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/history`, lastModified: latest, changeFrequency: "daily" },
    { url: `${SITE_URL}/live` },
    ...days.flatMap((p) => [
      ...(getRace(p.id) ? [{ url: `${SITE_URL}/race/${p.id}`, lastModified: p.id }] : []),
      { url: `${SITE_URL}/play/${p.id}`, lastModified: p.id },
    ]),
  ];
}
