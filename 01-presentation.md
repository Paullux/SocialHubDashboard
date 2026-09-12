<div align="center">

[🏠 Sommaire](README.md) ·
[🌍 Présentation](01-presentation.md) ·
[⚙️ Fonctionnement](02-fonctionnement.md) ·
[🏗️ Architecture](03-architecture.md) ·
[🔒 Sécurité & vie privée](04-securite-vie-privee.md) ·
[🔌 Intégrations API](05-integrations-api.md) ·
[🗺️ Vision & roadmap](06-vision-roadmap.md) ·
[❓ FAQ](07-faq.md)

</div>

---

# 🌍 Présentation

![Niveau](https://img.shields.io/badge/niveau-grand%20public-brightgreen)

## Le problème

Un créateur de contenu qui publie sur **YouTube**, **TikTok** et **Instagram** en même temps doit aujourd'hui jongler entre trois applications différentes pour savoir comment ses vidéos se comportent : combien de vues, combien de likes, combien de commentaires, sur quelle plateforme ça marche le mieux.

Chaque appli a son propre tableau de bord, ses propres graphiques, sa propre façon de présenter les chiffres. Résultat : du temps perdu à naviguer entre les apps, et une vision d'ensemble difficile à obtenir.

## La solution

**Social Hub** rassemble tout ça **au même endroit** : un seul tableau de bord qui affiche toutes tes vidéos — YouTube, TikTok et Instagram confondues — avec leurs statistiques (vues, likes, commentaires, partages), triables et comparables.

> [!IMPORTANT]
> Social Hub est **strictement en lecture seule**. Il consulte tes statistiques, il ne publie, ne modifie et ne supprime jamais rien à ta place sur tes comptes.

## À qui c'est destiné

- **Aux créateurs de contenu** qui publient sur plusieurs plateformes et veulent comprendre leur audience sans changer d'onglet toutes les cinq minutes.
- **Aux créateurs solos et petites structures** qui n'ont pas besoin d'un outil d'agence à 40€/mois pour juste voir leurs chiffres.
- **Aux développeurs curieux** — le projet est pensé pour être compréhensible et, à terme, ouvert (voir la [vision & roadmap](06-vision-roadmap.md)).

## Ce que Social Hub fait aujourd'hui

- Connexion sécurisée à tes comptes YouTube, TikTok et Instagram (OAuth, lecture seule).
- Un tableau de bord unique listant toutes tes vidéos, triable par date, vues, likes, commentaires, partages.
- Une page de statistiques par vidéo avec l'évolution dans le temps (vues/heure, vues/jour, engagement).
- Un historique conservé automatiquement, même si tu ne consultes pas le dashboard tous les jours.

<details>
<summary>🔧 Pour les développeurs — en une phrase technique</summary>

<br>

Social Hub est une application **Next.js** (App Router) hébergée sur **Vercel**, qui interroge les APIs officielles de YouTube Data API v3, TikTok for Developers et Instagram Graph API via OAuth, stocke les jetons chiffrés et un historique de métriques dans une base **PostgreSQL (Neon)**, et affiche le tout derrière une authentification **Kinde**.

Détails complets : [Architecture](03-architecture.md).

</details>

---

<div align="center">

⬅️ [Sommaire](README.md) · ➡️ [Fonctionnement](02-fonctionnement.md)

</div>
