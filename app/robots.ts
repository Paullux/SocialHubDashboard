// app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Le middleware refuse déjà ces chemins à qui n'a pas de session : les
 *  interdire ici ne protège rien, ça évite seulement aux crawlers de dépenser
 *  leur budget d'exploration sur des redirections vers /login. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/analytics", "/settings/", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
