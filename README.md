# Social Hub — Dashboard YouTube & TikTok

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)
[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com)

**Social Hub** est un dashboard qui agrège et analyse tes vidéos YouTube et TikTok au même endroit.  
Il te permet de visualiser rapidement les performances (vues, likes, commentaires, partages) et de comparer l’impact de tes contenus sur chaque plateforme.

---

## 🚀 Fonctionnalités

- 🔗 **Connexion API YouTube & TikTok**
- 📊 **KPIs visibles sous chaque vidéo** :
  - Vues
  - Likes
  - Commentaires
  - Partages (TikTok uniquement)
- ⚡ **Barre de tri fixe** :  
  trie les vidéos par **Date, Vues, Likes, Commentaires, Partages**
- 🎨 **UI responsive** : cartes vidéos avec vignettes, titres, KPI toujours visibles
- 🔄 **Chargement par lots** (+60 vidéos à la fois)
- ☁️ **Déploiement automatique sur Vercel**

---

## 🛠️ Installation locale

### Prérequis
- Node.js 18+
- Yarn ou pnpm (recommandé)

### Étapes
```bash
# Cloner le projet
git clone https://github.com/ton-username/social-hub.git
cd social-hub

# Installer les dépendances
pnpm install
# ou
yarn install
# ou
npm install

# Lancer en local
pnpm dev
```
Le site est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 🔑 Variables d’environnement

À définir dans `.env.local` (non versionné) :

```env
# YouTube
YT_API_KEY=ta_clef_api_youtube
YT_CHANNEL_ID=ton_channel_id

# TikTok (via OAuth 2.0, token stocké en BDD)
DATABASE_URL=postgres://...
```

- `YT_API_KEY` : clé API générée sur Google Cloud Console  
- `YT_CHANNEL_ID` : l’ID du channel YouTube à analyser  
- `DATABASE_URL` : connexion à ta BDD pour stocker le token TikTok

---

## 📦 Déploiement

Le projet est configuré pour **Vercel** :

1. Connecte ton repo GitHub à Vercel
2. Ajoute les variables d’environnement dans *Project → Settings → Environment Variables*
3. Ajoute ton domaine custom (ex. `https://social-hub.fr`)
4. Chaque `git push main` déploie automatiquement en production

---

## 📈 Roadmap

- [ ] Graphiques d’évolution (Recharts)
- [ ] Filtre par plateforme (YouTube / TikTok / Tous)
- [ ] Ratio d’engagement automatique
- [ ] Export CSV/Excel des KPIs
- [ ] Authentification multi-utilisateurs

---

## 🤝 Contribution

Les contributions sont les bienvenues !  
Fork le repo, crée une branche et fais une PR.

---

## 📜 Licence

Distribué sous licence [MIT](LICENSE.md).
