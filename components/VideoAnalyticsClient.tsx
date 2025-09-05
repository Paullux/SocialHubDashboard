"use client";
import dynamic from "next/dynamic";

const VideoAnalytics = dynamic(() => import("./VideoAnalytics"), {
  ssr: false,
  // loading: () => <div className="text-sm text-neutral-500">Chargement du graphe…</div>,
});

export default VideoAnalytics;
