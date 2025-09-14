// components/dashboard/KpiLine.tsx
"use client";

import type { VideoItem } from "@/lib/types";

export default function KpiLine({ v }: { v: VideoItem }) {
  const nf = new Intl.NumberFormat("fr-FR");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
      <span>
        Vue{(v.viewCount ?? 0) > 1 ? "s" : ""} :{" "}
        <strong>{v.viewCount != null ? nf.format(v.viewCount) : "—"}</strong>
      </span>
      <span>
        Like{(v.likeCount ?? 0) > 1 ? "s" : ""} :{" "}
        <strong>{v.likeCount != null ? nf.format(v.likeCount) : "—"}</strong>
      </span>
      <span>
        Comm. :{" "}
        <strong>{v.commentCount != null ? nf.format(v.commentCount) : "—"}</strong>
      </span>
      {v.platform === "tiktok" && v.shareCount != null && (
        <span>
          Partages : <strong>{nf.format(v.shareCount)}</strong>
        </span>
      )}
    </div>
  );
}
