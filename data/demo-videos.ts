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

/** Jeu d'exemple de la page /demo. Les titres reprennent les pochettes des
 *  vignettes, et chaque plateforme garde ses habitudes d'écriture : titre court
 *  et description longue côté YouTube, légende unique tenant lieu de titre côté
 *  Instagram (avec ses retours chariot isolés, tels que l'API les renvoie),
 *  hashtags et mention du son côté TikTok. C'est aussi ce que la démo doit
 *  montrer : le dashboard reçoit des métadonnées de formes différentes. */
const demoVideos: DemoVideo[] = [
  {
    id: "y1",
    title: "Good Days — Acoustic Session",
    description:
      "Enregistré en une prise, guitare et voix, sans retouche.\n\nUne session tournée un dimanche après-midi, avec la lumière de fin de journée pour seul éclairage.\n\n00:00 Intro\n00:38 Premier couplet\n02:14 Pont instrumental",
    thumbnailUrl: "/thumbs/1.jpg",
    views: 1280,
    likes: 122,
    comments: 18,
    platform: "youtube",
  },
  {
    id: "y2",
    title: "Midnight Sessions — musique, histoires et fins de nuit",
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
      "Luna — Beats & Good Vibes 🎧\r\rCasque sur les oreilles, deux heures à chercher la bonne boucle.\rSon original\r#beats #lofi #reels #homestudio",
    description:
      "Luna — Beats & Good Vibes 🎧\r\rCasque sur les oreilles, deux heures à chercher la bonne boucle.\rSon original\r#beats #lofi #reels #homestudio",
    thumbnailUrl: "/thumbs/3.jpg",
    views: 2050,
    likes: 310,
    comments: 44,
    platform: "instagram",
  },
  {
    id: "i2",
    title: "The Roads — Live Sessions, épisode 3",
    thumbnailUrl: "/thumbs/4.jpg",
    views: 1520,
    likes: 150,
    comments: 21,
    platform: "instagram",
  },
  {
    id: "y3",
    title: "Sora — Music for a Brighter Tomorrow",
    thumbnailUrl: "/thumbs/5.jpg",
    views: 760,
    likes: 54,
    comments: 9,
    platform: "youtube",
  },
  {
    id: "t3",
    title: "Sunset — Live at Home",
    description:
      "Reprise en fin de journée, une seule prise, rien de retouché.\n\nMusique : son original\n#live #acoustic #cover #fyp",
    thumbnailUrl: "/thumbs/6.jpg",
    views: 3110,
    likes: 420,
    comments: 63,
    platform: "tiktok",
  },
  {
    id: "y4",
    title: "Riverflow — Live Session : une guitare, un micro",
    thumbnailUrl: "/thumbs/7.jpg",
    views: 640,
    likes: 70,
    comments: 7,
    platform: "youtube",
  },
  {
    id: "y5",
    title: "Novae — Electronic Stories, le set complet",
    thumbnailUrl: "/thumbs/8.jpg",
    views: 890,
    likes: 95,
    comments: 10,
    platform: "youtube",
  },
  {
    id: "t4",
    title: "Solaris — Acoustic Moments",
    thumbnailUrl: "/thumbs/9.jpg",
    views: 2210,
    likes: 260,
    comments: 31,
    platform: "tiktok",
  },
];

export default demoVideos;
