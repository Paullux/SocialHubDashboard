// app/api/diag/instagram-login/route.ts
// Diagnostic temporaire : valide le flux "Instagram API with Instagram Login"
// (graph.instagram.com) avec un token généré à la main dans le portail Meta
// (Cas d'utilisation > API Instagram > Configuration de l'API avec la connexion
// Instagram > Générez des tokens d'accès), avant de construire le vrai flow OAuth.
// À supprimer une fois la validation faite.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { jsonNoStore, timingSafeEqualStr } from "@/lib/security";

const IG_GRAPH = "https://graph.instagram.com/v23.0";

async function safeFetch(url: string) {
  try {
    const res = await fetch(url);
    const body = await res.json();
    return { status: res.status, body };
  } catch (e: any) {
    return { error: String(e?.message || e) };
  }
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || !timingSafeEqualStr(key, process.env.CRON_SECRET)) {
    return jsonNoStore({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.IG_LOGIN_TEST_TOKEN;
  if (!token) {
    return jsonNoStore(
      { error: "IG_LOGIN_TEST_TOKEN manquant dans les variables d'env Vercel" },
      { status: 500 }
    );
  }
  const t = encodeURIComponent(token);

  const me = await safeFetch(
    `${IG_GRAPH}/me?fields=id,username,account_type,media_count&access_token=${t}`
  );
  const media = await safeFetch(
    `${IG_GRAPH}/me/media?fields=id,caption,media_type,permalink,timestamp,like_count,comments_count&access_token=${t}`
  );

  const firstMediaId = (media as any)?.body?.data?.[0]?.id;
  const mediaInsights = firstMediaId
    ? await safeFetch(
        `${IG_GRAPH}/${firstMediaId}/insights?metric=views,reach,likes,comments,saved,shares&access_token=${t}`
      )
    : null;

  const accountInsights = await safeFetch(
    `${IG_GRAPH}/me/insights?metric=reach&period=day&metric_type=total_value&access_token=${t}`
  );

  return jsonNoStore({ me, media, mediaInsights, accountInsights });
}
