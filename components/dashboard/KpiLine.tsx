// components/dashboard/KpiLine.tsx
"use client";

import type { VideoItem } from "@/lib/types";
import { LOCALE, type Lang } from "@/lib/uiLang";

const T = {
  fr: { view: "Vue", views: "Vues", like: "Like", likes: "Likes", comments: "Comm.", shares: "Partages", sep: " :" },
  en: { view: "View", views: "Views", like: "Like", likes: "Likes", comments: "Comm.", shares: "Shares", sep: ":" },
} as const;

export default function KpiLine({ v, lang = "fr" }: { v: VideoItem; lang?: Lang }) {
  const nf = new Intl.NumberFormat(LOCALE[lang]);
  const t = T[lang];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
      <span>
        {(v.viewCount ?? 0) > 1 ? t.views : t.view}
        {t.sep}{" "}
        <strong>{v.viewCount != null ? nf.format(v.viewCount) : "—"}</strong>
      </span>
      <span>
        {(v.likeCount ?? 0) > 1 ? t.likes : t.like}
        {t.sep}{" "}
        <strong>{v.likeCount != null ? nf.format(v.likeCount) : "—"}</strong>
      </span>
      <span>
        {t.comments}
        {t.sep}{" "}
        <strong>{v.commentCount != null ? nf.format(v.commentCount) : "—"}</strong>
      </span>
      {v.platform === "tiktok" && v.shareCount != null && (
        <span>
          {t.shares}
          {t.sep}{" "}
          <strong>{nf.format(v.shareCount)}</strong>
        </span>
      )}
    </div>
  );
}
