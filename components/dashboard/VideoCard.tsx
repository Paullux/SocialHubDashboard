// components/dashboard/VideoCard.tsx
"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import FormatDate from "@/components/FormatDate";
import type { VideoItem } from "@/lib/types";
import KpiLine from "./KpiLine";

/** Ramène toutes les formes de saut de ligne à `\n` (seul séparateur que
 *  `white-space: pre-line` sait rendre) et resserre les lignes vides.
 *  `video_description` de TikTok peut contenir : des `\r` seuls, des séquences
 *  `\r\n` / `\n` LITTÉRALES (double encodage), voire des balises `<br>`.
 *  Le texte reste une string affichée en `{texte}` (pas de HTML injecté). */
function normalizeText(s?: string | null): string {
  return (s ?? "")
    .replace(/<br\s*\/?>/gi, "\n") // balises <br> éventuelles
    .replace(/\\r\\n?|\\n/g, "\n") // séquences "\r\n" / "\n" littérales
    .replace(/\r\n?/g, "\n") // vrais CRLF / CR isolés
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Ré-insertion best-effort de sauts de ligne quand la source les a perdus :
 *  l'API TikTok (`video/list`) et son oEmbed renvoient `video_description`
 *  totalement à plat (ni `\n`, ni `<br>`). On ne s'appuie que sur des repères
 *  non ambigus, et on ne touche à rien si le texte a déjà des sauts de ligne
 *  (YouTube, par ex., les conserve). */
/** Espace horizontale (dont NBSP / espace fine insécable FR), jamais le `\n`. */
const HSP = "[^\\S\\n]";
/** Un texte ressemble à un nouveau début de phrase : majuscule, chiffre, #,
 *  puce, ou emoji. */
const SENTENCE_START = "[\\p{Lu}\\p{Nd}#•]|\\p{Extended_Pictographic}";

function prettifyCaption(s: string): string {
  if (!s || s.includes("\n")) return s;
  return (
    s
      // 1) chaque puce sur sa propre ligne
      .replace(/\s*[•·]\s+/g, "\n• ")
      // 2) fin de phrase → saut de ligne. Sans lookbehind (Safari < 16.4) :
      //    la ponctuation doit suivre un mot en minuscule / un chiffre / une
      //    parenthèse ou un guillemet fermant (→ pas « M. Dupont »), l'espace
      //    fine française éventuelle est conservée ; et la suite doit ressembler
      //    à un nouveau début.
      .replace(
        new RegExp(
          `([\\p{Ll}\\p{Nd})»"'’])(${HSP}?)([.!?…]+)${HSP}+(?=${SENTENCE_START})`,
          "gu",
        ),
        "$1$2$3\n",
      )
      // 3) une ligne vide avant ET après un bloc de puces
      .replace(/\n(• [^\n]*(?:\n• [^\n]*)*)/g, "\n\n$1\n\n")
      // 4) bloc de hashtags final sur sa propre ligne
      .replace(/\s+(#[^\s#]+(?:\s+#[^\s#]+)+)\s*$/, "\n\n$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

type TipContent = {
  /** Titre (gras) — vide si la vidéo n'a pas de vrai titre distinct. */
  headline: string;
  /** Corps (non gras) : description, ou la légende complète (TikTok/Insta). */
  body: string;
};

function buildTip(v: VideoItem): TipContent | null {
  const title = normalizeText(v.title);
  const desc = normalizeText(v.description);

  // TikTok / Instagram : `title` est en réalité la légende, il n'y a pas de
  // titre distinct → tout passe en corps de texte (non gras).
  const titleIsCaption =
    !desc ||
    desc === title ||
    title.startsWith(desc) ||
    desc.startsWith(title);

  const headline = titleIsCaption ? "" : title;
  const body = prettifyCaption(titleIsCaption ? title : desc);

  // Rien de plus à montrer que ce que la carte affiche déjà.
  if (!headline && (!body || (body.length <= 70 && !body.includes("\n")))) {
    return null;
  }
  return { headline, body };
}

/** Miniature verticale (Reels/TikTok...) : le cadre 16:9 reste identique pour
 *  toutes les cartes (grille alignée), l'image est ajustée à la hauteur du
 *  cadre — rien n'est rogné — et les bandes latérales sont comblées par la
 *  même image, agrandie et assombrie.
 *
 *  Sans flou : il coûtait une passe de filtre sur toute la surface de chaque
 *  carte verticale, alors que l'agrandissement et l'assombrissement suffisent
 *  à ce que le fond se lise comme un remplissage.
 *
 *  Horizontale ou carrée : l'image remplit le cadre, léger rognage possible
 *  sur les bords si le ratio diffère un peu de 16:9. */
function isPortraitThumbnail(v: VideoItem): boolean {
  return (
    typeof v.thumbnailWidth === "number" &&
    typeof v.thumbnailHeight === "number" &&
    v.thumbnailHeight > v.thumbnailWidth
  );
}

export default function VideoCard({
  video: v,
  demo = false,
  priority = false,
}: {
  video: VideoItem;
  /** Vidéo factice (page /demo) : id non réel, on n'appelle pas l'API de stats. */
  demo?: boolean;
  /** Carte visible dès le chargement (premières lignes de la grille). Sa
   *  miniature est candidate au LCP : elle se charge donc sans attendre, et
   *  la carte échappe au `content-visibility` qui allège les suivantes. */
  priority?: boolean;
}) {
  const tip = buildTip(v);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const portrait = isPortraitThumbnail(v);

  const track = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);
  const anchor = useCallback((e: React.FocusEvent<HTMLLIElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left + 8, y: r.bottom + 2 });
  }, []);
  const hide = useCallback(() => setPos(null), []);

  const altText = normalizeText(v.title);

  return (
    <li
      className={
        "group relative bg-neutral-800/70 backdrop-blur rounded-2xl overflow-hidden border border-neutral-700 shadow-sm hover:shadow transition flex flex-col" +
        // Hors des premières lignes, le navigateur saute entièrement le rendu
        // tant que la carte n'approche pas de l'écran. Sur une grille de 60
        // vignettes — dont beaucoup de verticales, avec leur fond flouté à
        // composer — c'est le poste de peinture le plus lourd. La taille
        // annoncée évite que la barre de défilement saute pendant le rendu.
        (priority ? "" : " [content-visibility:auto] [contain-intrinsic-size:auto_320px]")
      }
      onMouseMove={tip ? track : undefined}
      onMouseLeave={hide}
      onFocusCapture={tip ? anchor : undefined}
      onBlurCapture={hide}
    >
      {/* Preview */}
      <a
        href={v.url || "#"}
        target="_blank"
        rel="noreferrer"
        aria-label={altText || "Ouvrir la vidéo"}
        className="block"
      >
        <div
          className={`relative aspect-video overflow-hidden ${portrait ? "bg-neutral-900" : "bg-neutral-100"}`}
        >
          {v.thumbnail ? (
            portrait ? (
              <>
                {/* Fond : la même image agrandie, en retrait, pour combler les
                    bandes latérales sans rogner ni laisser de vide. Même URL
                    que le premier plan, donc une seule requête réseau. */}
                <img
                  src={v.thumbnail}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-110 opacity-40"
                  loading={priority ? "eager" : "lazy"}
                  decoding="async"
                />
                {/* Assombrit le fond pour rester dans le thème sombre, quelle
                    que soit la luminosité de la vignette. */}
                <div className="absolute inset-0 bg-neutral-900/55" />
                <img
                  src={v.thumbnail}
                  alt={altText}
                  className="relative w-full h-full object-contain"
                  loading={priority ? "eager" : "lazy"}
                  fetchPriority={priority ? "high" : undefined}
                  decoding="async"
                />
              </>
            ) : (
              <img
                src={v.thumbnail}
                alt={altText}
                className="w-full h-full object-cover"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : undefined}
                decoding="async"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
              (Pas d’aperçu)
            </div>
          )}
        </div>
      </a>

      {/* Infos */}
      <div className="flex flex-col flex-1">
        <div className="p-2 sm:p-3 flex items-center gap-2 text-[11px] sm:text-xs text-neutral-300">
          <span className="uppercase tracking-wide rounded-full border border-neutral-500 px-1.5 py-0.5">
            {v.platform}
          </span>
          {v.publishedAt && <FormatDate iso={v.publishedAt} />}
        </div>

        <div className="px-2 sm:px-3 pb-2 flex-1">
          <h3 className="font-medium text-sm sm:text-base line-clamp-2 text-neutral-100">
            {v.title}
          </h3>
        </div>

        <div className="bg-neutral-800/70 backdrop-blur mt-auto px-2 sm:px-3 py-2 flex items-center justify-between text-neutral-100">
          <div className="overflow-x-auto whitespace-nowrap pr-2">
            <KpiLine v={v} />
          </div>

          <Link
            href={demo ? "/demo/analytics" : `/analytics/${v.id}?platform=${v.platform}`}
            className="ml-2 text-[11px] sm:text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 flex items-center gap-1 shrink-0"
            aria-label={`Ouvrir les stats pour ${altText}`}
            title="Stats"
          >
            <span aria-hidden>📈</span>
            <span className="hidden sm:inline">Stats</span>
          </Link>
        </div>
      </div>

      {tip && pos && <HoverTip pos={pos} content={tip} />}
    </li>
  );
}

/** Infobulle : panneau sombre flouté, coin haut-gauche calé sous le curseur,
 *  rendue dans <body> pour échapper à l'`overflow-hidden` de la carte. */
function HoverTip({
  pos,
  content,
}: {
  pos: { x: number; y: number };
  content: TipContent;
}) {
  if (typeof document === "undefined") return null;

  const W = 320;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Coin haut-gauche calé juste sous le curseur.
  const left = Math.min(pos.x + 4, Math.max(8, vw - W - 8));
  const flipUp = pos.y > vh * 0.62;
  const top = flipUp ? pos.y - 8 : pos.y + 12;

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: "fixed",
        left,
        top,
        maxWidth: W,
        transform: flipUp ? "translateY(-100%)" : undefined,
      }}
      className="pointer-events-none z-[60] max-h-[60vh] overflow-hidden rounded-xl border border-white/10 bg-neutral-950/90 p-3 text-left shadow-xl ring-1 ring-black/30 backdrop-blur-lg"
    >
      {content.headline && (
        <p className="text-sm font-semibold leading-snug text-neutral-50">
          {content.headline}
        </p>
      )}
      {content.body && (
        <p
          className={`${
            content.headline ? "mt-1.5 " : ""
          }line-clamp-[18] whitespace-pre-line text-xs leading-relaxed text-neutral-200`}
        >
          {content.body}
        </p>
      )}
    </div>,
    document.body,
  );
}
