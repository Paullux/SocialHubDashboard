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

Social Hub se connecte à trois plateformes via leurs API **officielles**, chacune avec son propre système d'autorisation (OAuth) et ses propres règles.

| Plateforme | Ce qui est utilisé | Données affichées |
|---|---|---|
| ▶️ **YouTube** | YouTube Data API v3 + YouTube Analytics API | Liste des vidéos, vues, statistiques de la chaîne |
| 🎵 **TikTok** | TikTok for Developers (Login Kit) | Liste des vidéos, vues, likes, commentaires, partages |
| 📸 **Instagram** | Instagram Graph API (Instagram Login) | Publications, vues, portée |

Pour les trois, l'autorisation demandée est strictement de **lecture** — voir [Sécurité & vie privée](04-securite-vie-privee.md).

## Statut de validation

Chaque plateforme impose un processus de vérification avant d'autoriser une application à être utilisée par des utilisateurs autres que son développeur. Ce n'est **pas un obstacle à l'usage personnel** — YouTube, TikTok et Instagram fonctionnent déjà pour le compte du développeur pendant que la vérification suit son cours en arrière-plan, nécessaire uniquement pour ouvrir Social Hub à d'autres créateurs.

> [!NOTE]
> Les trois vérifications (YouTube, TikTok, Instagram) sont en cours d'examen par leurs équipes respectives. Cette page sera mise à jour à mesure qu'elles aboutissent.

<details>
<summary>🔧 Pour les développeurs — comment ça marche techniquement</summary>

<br>

Chaque intégration suit le même schéma :

1. **Redirection OAuth** : l'utilisateur clique "Connecter", est redirigé vers la page d'autorisation officielle de la plateforme (`accounts.google.com`, `tiktok.com`, `instagram.com`).
2. **Callback signé** : la plateforme redirige vers une route dédiée de Social Hub avec un code d'échange à usage unique.
3. **Échange de jeton** : le code est échangé contre un jeton d'accès (et, selon la plateforme, un jeton de rafraîchissement) directement entre le serveur de Social Hub et la plateforme.
4. **Stockage chiffré** : le jeton est chiffré et associé au compte Social Hub de l'utilisateur (table `AccountLink`).
5. **Appels API** : les vidéos et statistiques sont ensuite récupérées à la demande (chargement du dashboard) et à intervalle régulier (snapshot horaire pour l'historique).

**Scopes demandés** (le strict nécessaire, jamais d'écriture) :

- YouTube : `youtube.readonly`, `yt-analytics.readonly`
- TikTok : `user.info.basic`, `video.list`
- Instagram : `instagram_business_basic`, `instagram_business_manage_insights`

**Renouvellement des jetons** : les jetons expirent après une durée fixée par chaque plateforme ; un rafraîchissement automatique a lieu avant expiration pour éviter toute coupure côté utilisateur.

</details>

---

<div align="center">

⬅️ [Sécurité & vie privée](04-securite-vie-privee.md) · ➡️ [Vision & roadmap](06-vision-roadmap.md)

</div>
