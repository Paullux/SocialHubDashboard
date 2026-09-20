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

# 🗺️ Vision & roadmap

![Niveau](https://img.shields.io/badge/niveau-grand%20public-brightgreen)

> [!NOTE]
> Cette page décrit une **direction souhaitée**, pas un engagement contractuel ni un état actuel du produit. Pour l'état réel aujourd'hui, voir [Fonctionnement](02-fonctionnement.md) et [Intégrations API](05-integrations-api.md).

## Où on en est

Aujourd'hui, Social Hub Dashboard est un **outil de consultation** : il rassemble et affiche les statistiques de tes vidéos YouTube, TikTok et Instagram. Le socle (connexion, sécurité, fiabilité des données) passe avant tout le reste — un produit qui fonctionne bien pour un usage simple avant d'ajouter des fonctionnalités plus ambitieuses.

## Où ça pourrait aller

### Étape suivante : publier, pas seulement consulter

L'idée à terme est d'ajouter un second usage à côté du suivi de performance : **publier une vidéo une seule fois, et la distribuer sur plusieurs plateformes** depuis une interface unique — avec les réglages propres à chaque réseau (titre, description, visibilité, miniature...).

```text
Créer → Publier → Mesurer → Comparer → Comprendre → Publier à nouveau
```

### Un modèle possible : open source + service hébergé

Une piste envisagée est de rendre le **code source libre**, et de vendre non pas le logiciel, mais la **simplicité de l'exploiter** :

- **Auto-hébergement** : qui veut tout maîtriser peut installer et héberger Social Hub Dashboard lui-même, gratuitement.
- **Social Hub Dashboard Cloud** : une version hébergée clé en main, sans configuration technique, pour qui veut que ça marche sans devenir administrateur système.

### Segmentation envisagée (non définitive)

| Palier | Pour qui | Idée de contenu |
|---|---|---|
| **Gratuit** | Un créateur, un usage simple | Suivi KPI de base, historique limité |
| **Créateur** | Qui gère activement ses réseaux | Historique complet, exports, publication multi-plateforme |
| **Agence** | Qui gère les réseaux d'autres personnes | Multi-clients, rôles, API, intégrations |

### Principe directeur

> **Résoudre parfaitement un petit problème réel, puis élargir progressivement.**

« Voir mes stats YouTube, TikTok et Instagram au même endroit » → « publier sur mes trois plateformes depuis le même endroit » → « piloter toute mon activité sociale depuis un seul outil ».

<details>
<summary>🔧 Pour les développeurs — roadmap technique envisagée</summary>

<br>

| Phase | Contenu |
|---|---|
| 1 — Intégration | YouTube, TikTok, Instagram : OAuth, comptes, contenus, KPI |
| 2 — Consolidation | Normalisation des métriques, historique, dashboard unifié |
| 3 — Fiabilisation | Renouvellement des jetons, gestion d'erreurs, sécurité, monitoring |
| 4 — Publication | Upload vidéo, sélection des plateformes, formulaires spécifiques, suivi de statut |
| 5 — Productivité | Calendrier éditorial, programmation, modèles, exports, rapports |
| 6 — Collaboration | Multi-utilisateurs, multi-créateurs, rôles, permissions |
| 7 — Écosystème | API publique Social Hub Dashboard, webhooks, intégrations (n8n, Make, Zapier) |

Une architecture de publication envisagée séparerait le stockage des métadonnées (base de données) du fichier vidéo lui-même (stockage objet type S3/R2), avec un adaptateur dédié par plateforme (`youtube/`, `tiktok/`, `instagram/`) implémentant une interface commune de publication.

Ce virage ne démarre qu'une fois le socle actuel — connexion, sécurité, fiabilité des données — solide et éprouvé, et pas avant.

</details>

---

<div align="center">

⬅️ [Intégrations API](05-integrations-api.md) · ➡️ [FAQ](07-faq.md)

</div>
