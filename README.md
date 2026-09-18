# Social Hub — Dashboard YouTube, TikTok & Instagram

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)
[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com)

**Social Hub** est un dashboard qui agrège et analyse tes vidéos YouTube, TikTok et Instagram au même endroit.  
Il te permet de visualiser rapidement les performances (vues, likes, commentaires, partages) et de comparer l’impact de tes contenus sur chaque plateforme.

> **Strictement en lecture seule.** Les autorisations demandées se limitent à la consultation : Social Hub ne publie, ne modifie et ne supprime rien sur tes comptes.

---

## 📚 Documentation

Une documentation complète (présentation, fonctionnement, architecture technique, sécurité, intégrations API, vision & roadmap) est disponible sur la branche dédiée **[`Documents`](https://github.com/Paullux/SocialHub/tree/Documents)** :

👉 **[Consulter la documentation](https://github.com/Paullux/SocialHub/tree/Documents)**

Écrite à deux niveaux de lecture — grand public et développeurs — avec la même navigation sur chaque page.

---

## 🚀 Fonctionnalités

- 🔗 **Connexion OAuth à YouTube, TikTok et Instagram** — les trois vérifications plateformes ont abouti (TikTok et Meta le 15/09/2026, Google le 16/09/2026)
- 📊 **KPIs visibles sous chaque vidéo** :
  - Vues
  - Likes
  - Commentaires
  - Partages (TikTok uniquement)
- ⚡ **Barre de tri fixe** :  
  trie les vidéos par **Date, Vues, Likes, Commentaires, Partages**
- 📈 **Page de statistiques par vidéo** : courbes d’évolution horaire et journalière (Recharts)
- ⏰ **Historique automatique** : un relevé horaire enregistre l’état des compteurs, même quand tu ne consultes pas le dashboard — c’est ce qui permet d’afficher une tendance et pas un chiffre figé
- 🕓 **Historique YouTube rétroactif** : à la connexion d’un compte Google, l’API YouTube Analytics remonte les données depuis la publication des vidéos, sans attendre l’accumulation des relevés
- 👥 **Multi-utilisateurs** : authentification Kinde, chaque utilisateur ne voit que ses propres comptes et statistiques
- 🎨 **UI responsive** : cartes vidéos avec vignettes, titres, KPI toujours visibles
- 🔄 **Chargement par lots** (+60 vidéos à la fois)
- 🔒 **RGPD** : jetons chiffrés AES-256-GCM, bandeau de consentement, effacement en self-service, rétention de l’historique limitée à 25 mois
- ☁️ **Déploiement automatique sur Vercel**

---

## 🛠️ Installation locale

### Prérequis
- Node.js **22.x** (voir `engines` dans `package.json`) — Node 20 est en fin de vie, ne plus l'utiliser
- pnpm (recommandé)
- Une base PostgreSQL accessible (Neon en production)

### Étapes
```bash
# Cloner le projet
git clone https://github.com/Paullux/SocialHub.git
cd SocialHub

# Installer les dépendances (déclenche prisma generate)
pnpm install

# Lancer en local
pnpm dev
```
Le site est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 🔑 Variables d’environnement

À définir dans `.env.local` (non versionné).

> ⚠️ `env.example` est **désynchronisé** du code : il déclare encore `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` (le code lit `GOOGLE_*`), `YT_CHANNEL_ID` qui n’est plus utilisé, et il ignore `DATABASE_URL`, les variables Kinde et `CRON_SECRET`. La liste ci-dessous est celle réellement lue par le code.

```env
# Base de données
DATABASE_URL=              # pooled
DATABASE_URL_UNPOOLED=     # direct (migrations Prisma)

# Authentification applicative (Kinde)
KINDE_CLIENT_ID=
KINDE_CLIENT_SECRET=
KINDE_ISSUER_URL=
KINDE_SITE_URL=
KINDE_POST_LOGIN_REDIRECT_URL=
KINDE_POST_LOGOUT_REDIRECT_URL=

# YouTube / Google
YT_API_KEY=                # clé serveur, API YouTube Data v3
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=

# Instagram (Instagram Login, sans Page Facebook)
IG_LOGIN_APP_ID=
IG_LOGIN_APP_SECRET=
IG_LOGIN_REDIRECT_URI=

# Chiffrement des jetons OAuth stockés (32 octets en base64)
TOKENS_AES_KEY=

# Relevé horaire
CRON_SECRET=

# Divers
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_MATOMO_URL=
NEXT_PUBLIC_MATOMO_SITE_ID=
NEXT_PUBLIC_MATOMO_CONTAINER=
ALLOW_TIKTOK_DEBUG=        # "1" pour ouvrir /api/tiktok/diagnostic
```

`TOKENS_AES_KEY` doit être défini **partout où l’application tourne**, y compris là où s’exécute le relevé horaire : sans elle, les jetons stockés sont indéchiffrables.

---

## 📦 Déploiement

L’application est déployée sur **Vercel** :

1. Connecte ton repo GitHub à Vercel
2. Ajoute les variables d’environnement dans *Project → Settings → Environment Variables*
3. Ajoute ton domaine custom (ex. `https://social-hub.fr`)
4. Chaque `git push` sur `main` déploie automatiquement en production

**Le relevé horaire n’est pas un cron Vercel.** `vercel.json` déclare `{"crons": []}` : c’est le crontab d’un VPS séparé (Hostinger, orchestré par Coolify) qui appelle `/api/cron/snapshot?key=$CRON_SECRET` toutes les heures. Ce même VPS héberge l’instance Matomo. Le workflow GitHub Actions `hourly-snapshot.yml` est désactivé et conservé comme secours manuel.

---

## 📈 Roadmap

- [x] Graphiques d’évolution (Recharts) — page `/analytics/[videoId]`
- [x] Authentification multi-utilisateurs — Kinde, jetons par utilisateur
- [ ] Filtre par plateforme (YouTube / TikTok / Instagram / Tous)
- [ ] Ratio d’engagement automatique
- [ ] Export CSV/Excel des KPIs
- [ ] Publication multi-plateformes depuis une interface unique — voir la [vision](https://github.com/Paullux/SocialHub/tree/Documents)

---

## 🤝 Contribution

Les contributions sont les bienvenues !  
Fork le repo, crée une branche et fais une PR.

---

## 📜 Licence

Distribué sous licence [MIT](LICENSE.md).
