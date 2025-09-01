export const runtime = "nodejs";       // ← ajoute ça tout en haut
export const dynamic = "force-dynamic"; // optionnel si tu veux éviter le cache
import { fetchVideos } from "@/lib/fetchVideos";

export default async function Dashboard() {
  const videos = await fetchVideos(); // pas de HTTP, pas d’URL
  
}
