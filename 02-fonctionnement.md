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

# ⚙️ Fonctionnement

![Niveau](https://img.shields.io/badge/niveau-grand%20public-brightgreen)

## Le parcours, étape par étape

### 1. Créer un compte Social Hub

La connexion à l'application elle-même passe par **Kinde**, un service d'authentification tiers. Il vérifie ton identité et protège l'accès à ton espace personnel — Social Hub ne gère jamais directement de mot de passe.

### 2. Connecter tes plateformes

Depuis les paramètres de ton compte, tu choisis quelles plateformes relier : YouTube, TikTok, Instagram — une par une, en un clic. Chaque connexion passe par le système d'autorisation officiel de la plateforme (OAuth) : tu es redirigé vers YouTube/TikTok/Instagram, tu acceptes (ou refuses) les autorisations demandées, et tu reviens sur Social Hub.

> [!NOTE]
> Tu peux relier une, deux ou les trois plateformes — rien n'est obligatoire. Tu peux aussi déconnecter un compte à tout moment.

### 3. Consulter ton tableau de bord

Une fois au moins un compte relié, le tableau de bord affiche toutes tes vidéos sous forme de cartes : miniature, titre, date de publication, et les statistiques disponibles (vues, likes, commentaires, partages pour TikTok). Tu peux trier par date, vues, likes ou commentaires.

### 4. Regarder l'évolution dans le temps

En cliquant sur "Stats" sur une vidéo, tu accèdes à une page dédiée avec des graphiques d'évolution : vues par heure, vues par jour, engagement. Ces courbes existent parce que Social Hub **prend une photo de tes statistiques toutes les heures**, en arrière-plan, même quand tu n'es pas connecté — c'est ce qui permet de voir une tendance et pas juste un chiffre figé.

## Ce que Social Hub ne fait jamais

- Il ne publie jamais de contenu à ta place.
- Il ne modifie ni ne supprime jamais une de tes vidéos, légendes ou commentaires.
- Il ne partage jamais tes données avec d'autres utilisateurs de Social Hub.

<details>
<summary>🔧 Pour les développeurs — sous le capot</summary>

<br>

- **Récupération des vidéos** : `GET /api/videos` interroge en direct chaque plateforme connectée (YouTube Data API v3 par clé API, TikTok `video/list` via OAuth, Instagram API with Instagram Login via OAuth), fusionne, déduplique et trie les résultats. Aucune mise en cache longue durée côté serveur — c'est toujours l'état actuel des plateformes qui est reflété (voir [Intégrations API](05-integrations-api.md)).
- **Historique des métriques** : un job planifié (cron horaire) rappelle `/api/cron/snapshot` toutes les heures, qui écrit une ligne `VideoMetric` par vidéo (`platform`, `videoId`, `snapshotAt`, `views`, `likes`, `comments`, `shares`) dans la base PostgreSQL. C'est cette table qui alimente les graphiques d'évolution — sans ce snapshot horaire, on n'aurait qu'un instantané, jamais une courbe.
- **Rétention** : l'historique de métriques est conservé 25 mois puis purgé automatiquement.
- **Authentification** : le middleware `proxy.ts` exige la permission Kinde `read:dashboard` sur `/dashboard/*`, `/analytics/*` et `/settings/linked-accounts/*`, et refuse par défaut toute route sous `/api/` à qui n'a pas de session. Les routes ajoutent leur propre garde (`requireDashboardUser()`) et un rate-limiting par IP.

Détails complets : [Architecture](03-architecture.md).

</details>

---

<div align="center">

⬅️ [Présentation](01-presentation.md) · ➡️ [Architecture](03-architecture.md)

</div>
