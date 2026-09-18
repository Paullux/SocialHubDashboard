// data/demo-videos.ts
export type DemoVideo = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  platform: "youtube" | "tiktok" | "instagram";
};

const demoVideos: DemoVideo[] = [
  {
    id: "y1",
    title: "Intro au projet Social-Hub",
    description:
      "Présentation du tableau de bord : agréger vidéos YouTube, TikTok et Instagram au même endroit et suivre les KPI dans le temps.\n\nChapitres, liens et sources dans la description complète — visible ici au survol de la carte.",
    thumbnailUrl: "/thumbs/1.jpg",
    views: 1280,
    likes: 122,
    comments: 18,
    platform: "youtube",
  },
  {
    id: "y2",
    title: "KPI YouTube : vues & watchtime",
    thumbnailUrl: "/thumbs/2.jpg",
    views: 980,
    likes: 76,
    comments: 12,
    platform: "youtube",
  },
  {
    id: "i1",
    // Instagram : pas de titre distinct, `title` = la légende (souvent des \r seuls).
    title:
      "Petit test d'animation image par image.\r\rMusique : son original\r#animation #motion #reels #creatortools",
    description:
      "Petit test d'animation image par image.\r\rMusique : son original\r#animation #motion #reels #creatortools",
    thumbnailUrl: "/thumbs/3.jpg",
    views: 2050,
    likes: 310,
    comments: 44,
    platform: "instagram",
  },
  {
    id: "i2",
    title: "Reel : 3 tips montage CapCut",
    thumbnailUrl: "/thumbs/4.jpg",
    views: 1520,
    likes: 150,
    comments: 21,
    platform: "instagram",
  },
  {
    id: "y3",
    title: "YouTube – intégration API Data",
    thumbnailUrl: "/thumbs/5.jpg",
    views: 760,
    likes: 54,
    comments: 9,
    platform: "youtube",
  },
  {
    id: "t3",
    title: "TikTok – trend musique",
    description:
      "Reprise d'une trend du moment, version piano.\n\nMusique : Still Here — extrait\n#piano #trend #cover #fyp",
    thumbnailUrl: "/thumbs/6.jpg",
    views: 3110,
    likes: 420,
    comments: 63,
    platform: "tiktok",
  },
  {
    id: "y4",
    title: "Comparatif NextAuth vs Kinde",
    thumbnailUrl: "/thumbs/7.jpg",
    views: 640,
    likes: 70,
    comments: 7,
    platform: "youtube",
  },
  {
    id: "y5",
    title: "Graphiques Recharts – Daily/Hourly",
    thumbnailUrl: "/thumbs/8.jpg",
    views: 890,
    likes: 95,
    comments: 10,
    platform: "youtube",
  },
  {
    id: "t4",
    title: "TikTok – export haute qualité",
    thumbnailUrl: "/thumbs/9.jpg",
    views: 2210,
    likes: 260,
    comments: 31,
    platform: "tiktok",
  },
];

export default demoVideos;
