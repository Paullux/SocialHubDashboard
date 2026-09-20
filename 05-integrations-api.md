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

# 🔌 Intégrations API

![Niveau](https://img.shields.io/badge/niveau-curieux%20%2B%20d%C3%A9veloppeurs-orange)

Social Hub Dashboard se connecte à trois plateformes via leurs API **officielles**, chacune avec son propre système d'autorisation (OAuth) et ses propres règles.

| Plateforme | Ce qui est utilisé | Données affichées |
|---|---|---|
| ▶️ **YouTube** | YouTube Data API v3 + YouTube Analytics API | Liste des vidéos, vues, statistiques de la chaîne |
| 🎵 **TikTok** | TikTok for Developers (Login Kit) | Liste des vidéos, vues, likes, commentaires, partages |
| 📸 **Instagram** | Instagram API with Instagram Login (`graph.instagram.com`) | Publications, vues, portée |

Pour les trois, l'autorisation demandée est strictement de **lecture** — voir [Sécurité & vie privée](04-securite-vie-privee.md).

## Statut de validation

Chaque plateforme impose un processus de vérification avant d'autoriser une application à être utilisée par des utilisateurs autres que son développeur.

> [!NOTE]
> **Les trois vérifications ont abouti.** Plus aucun blocage côté plateforme pour ouvrir Social Hub Dashboard à d'autres créateurs.

| Plateforme | Vérification | Obtenue le |
|---|---|---|
| 🎵 TikTok | Passage Sandbox → Production | 15 septembre 2026 |
| 📸 Instagram | App Review Meta | 15 septembre 2026 |
| ▶️ YouTube | Vérification OAuth Google (branding + accès aux données) | 16 septembre 2026 |

<details>
<summary>🔧 Pour les développeurs — comment ça marche techniquement</summary>

<br>

Chaque intégration suit le même schéma :

1. **Redirection OAuth** : l'utilisateur clique "Connecter", est redirigé vers la page d'autorisation officielle de la plateforme (`accounts.google.com`, `tiktok.com`, `instagram.com`).
2. **Callback signé** : la plateforme redirige vers une route dédiée de Social Hub Dashboard avec un code d'échange à usage unique.
3. **Échange de jeton** : le code est échangé contre un jeton d'accès (et, selon la plateforme, un jeton de rafraîchissement) directement entre le serveur de Social Hub Dashboard et la plateforme.
4. **Stockage chiffré** : le jeton est chiffré et associé au compte Social Hub Dashboard de l'utilisateur (table `AccountLink`).
5. **Appels API** : les vidéos et statistiques sont ensuite récupérées à la demande (chargement du dashboard) et à intervalle régulier (snapshot horaire pour l'historique).

**Scopes demandés** (le strict nécessaire, jamais d'écriture) :

- YouTube : `youtube.readonly`, `yt-analytics.readonly`
- TikTok : `user.info.basic`, `video.list`
- Instagram : `instagram_business_basic`, `instagram_business_manage_insights`

**Renouvellement des jetons** : les jetons expirent après une durée fixée par chaque plateforme ; un rafraîchissement automatique a lieu avant expiration pour éviter toute coupure côté utilisateur. Côté Instagram, le jeton longue durée est renouvelé par le snapshot horaire dès qu'il arrive à moins de dix jours de son expiration.

**Historique antérieur à la connexion** : côté YouTube, le scope `yt-analytics.readonly` permet de remonter l'historique des vidéos **depuis leur publication** au moment où le compte est relié, au lieu d'attendre que le snapshot horaire accumule des points. Les autres plateformes n'offrent pas d'équivalent : leur historique démarre à la connexion.

</details>

---

<div align="center">

⬅️ [Sécurité & vie privée](04-securite-vie-privee.md) · ➡️ [Vision & roadmap](06-vision-roadmap.md)

</div>
