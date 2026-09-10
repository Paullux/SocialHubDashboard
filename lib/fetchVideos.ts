// lib/fetchVideos.ts
import type { VideoItem } from "@/lib/types";

/**
 * Récupère les dernières vidéos d'un channel YouTube avec KPI.
 * - 1) channels.list pour trouver la playlist "uploads"
 * - 2) playlistItems.list pour lister les videoIds (pagination)
 * - 3) videos.list (snippet,statistics) pour récupérer KPI + métadonnées
 */
export async function fetchYouTubeLatest(
  apiKey: string,
  channelId: string,
  limit = 12
): Promise<VideoItem[]> {
  // 1) uploads playlist id
  const chUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  chUrl.searchParams.set("part", "contentDetails");
  chUrl.searchParams.set("id", channelId);
  chUrl.searchParams.set("key", apiKey);

  const chRes = await fetch(chUrl.toString(), { cache: "no-store" });
  if (!chRes.ok) throw new Error(`YouTube channels.list failed: ${chRes.status}`);
  const chData = await chRes.json();
  const uploads = chData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads as
    | string
    | undefined;
  if (!uploads) throw new Error("Impossible de récupérer la playlist 'uploads'.");

  // 2) collect video ids (pagination)
  const ids: string[] = [];
  let pageToken: string | undefined;
  const pageSize = Math.min(limit, 50);
  while (ids.length < limit) {
    const piUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    piUrl.searchParams.set("part", "contentDetails");
    piUrl.searchParams.set("playlistId", uploads);
    piUrl.searchParams.set("maxResults", String(pageSize));
    if (pageToken) piUrl.searchParams.set("pageToken", pageToken);
    piUrl.searchParams.set("key", apiKey);

    const piRes = await fetch(piUrl.toString(), { cache: "no-store" });
    if (!piRes.ok) throw new Error(`YouTube playlistItems.list failed: ${piRes.status}`);
    const piData = await piRes.json();

    const slice = (piData?.items ?? [])
      .map((it: any) => it?.contentDetails?.videoId)
      .filter(Boolean) as string[];

    ids.push(...slice);
    pageToken = piData?.nextPageToken;
    if (!pageToken || slice.length === 0) break;
  }

  const limited = ids.slice(0, limit);
  if (limited.length === 0) return [];

  // 3) batch videos.list to get snippet + statistics
  const out: VideoItem[] = [];
  for (let i = 0; i < limited.length; i += 50) {
    const batch = limited.slice(i, i + 50);
    const vUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    vUrl.searchParams.set("part", "snippet,statistics");
    vUrl.searchParams.set("id", batch.join(","));
    vUrl.searchParams.set("key", apiKey);

    const vRes = await fetch(vUrl.toString(), { cache: "no-store" });
    if (!vRes.ok) throw new Error(`YouTube videos.list failed: ${vRes.status}`);
    const vData = await vRes.json();

    const mapped: VideoItem[] = (vData?.items ?? []).map((v: any) => {
      const id = String(v?.id ?? "");
      const sn = v?.snippet ?? {};
      const st = v?.statistics ?? {};

      // thumbnails : on prend le meilleur dispo
      const thumb =
        sn?.thumbnails?.maxres?.url ||
        sn?.thumbnails?.high?.url ||
        sn?.thumbnails?.medium?.url ||
        sn?.thumbnails?.default?.url ||
        "";

      // IMPORTANT: on **renseigne les KPI** (0 si absent pour éviter "—")
      const views =
        typeof st?.viewCount === "string" ? Number(st.viewCount) : Number(st?.viewCount ?? 0);
      const likes =
        typeof st?.likeCount === "string" ? Number(st.likeCount) : Number(st?.likeCount ?? 0);
      const comments =
        typeof st?.commentCount === "string"
          ? Number(st.commentCount)
          : Number(st?.commentCount ?? 0);

      // Les descriptions YouTube peuvent faire plusieurs milliers de caractères
      // (liens, minutages, promo). On borne pour l'infobulle et le poids réseau.
      const rawDesc = typeof sn?.description === "string" ? sn.description.trim() : "";
      const description =
        rawDesc.length > 800 ? `${rawDesc.slice(0, 800).trimEnd()}…` : rawDesc;

      return {
        id,
        platform: "youtube",
        title: sn?.title ?? "",
        description,
        url: id ? `https://www.youtube.com/watch?v=${id}` : "",
        thumbnail: thumb,
        publishedAt: sn?.publishedAt ?? new Date().toISOString(),
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        // champs optionnels du type (non utilisés ici) :
        embedHtml: undefined,
        embedLink: undefined,
        shareCount: undefined, // pas fourni par YouTube
      };
    });

    out.push(...mapped);
  }

  // tri décroissant par date (au cas où l’API ne renverrait pas déjà triée)
  out.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  return out;
}
