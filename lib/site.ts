// lib/site.ts

/** Domaine canonique du site.
 *
 *  Volontairement en dur, et non `NEXT_PUBLIC_BASE_URL` : cette variable vaut
 *  l'URL Vercel de préproduction (social-hub-seven.vercel.app) et ferait
 *  annoncer ce domaine dans les aperçus de lien, la balise canonique, le
 *  sitemap et le robots.txt — soit exactement les endroits où une URL de
 *  préproduction indexée par erreur fait le plus de dégâts.
 */
export const SITE_URL = "https://social-hub.fr";
