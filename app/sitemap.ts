// app/sitemap.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Seules les pages publiques listées dans `PUBLIC_PATHS` (proxy.ts) ont leur
 *  place ici. `/login` en est écarté : c'est une porte d'entrée, pas un
 *  contenu, et Google n'a rien à en indexer. Tout ce qui vit derrière une
 *  session (`/dashboard`, `/analytics`, `/settings/*`) est de toute façon
 *  refusé par le middleware avant d'atteindre un crawler. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/demo`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/delete-data`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
