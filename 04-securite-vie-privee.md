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

# 🔒 Sécurité & vie privée

![Niveau](https://img.shields.io/badge/niveau-grand%20public-brightgreen)

## Le principe de base : lecture seule

> [!IMPORTANT]
> Social Hub ne peut **ni publier, ni modifier, ni supprimer** quoi que ce soit sur tes comptes YouTube, TikTok ou Instagram. Les autorisations demandées lors de la connexion sont volontairement limitées à la **consultation** : liste des vidéos, statistiques (vues, likes, commentaires).

## Comment tes données sont protégées

- **Jetons de connexion chiffrés** : quand tu autorises Social Hub à accéder à un compte, la clé d'accès qui en résulte (le "jeton OAuth") est chiffrée (AES-256-GCM) avant d'être stockée en base de données — jamais en clair.
- **Base de données hébergée en Europe** : les données sont stockées chez Neon, dans un centre de données situé en Union Européenne (Francfort).
- **Aucun mot de passe géré par Social Hub** : l'authentification à l'application passe entièrement par Kinde, un prestataire spécialisé.
- **Historique limité dans le temps** : les statistiques historisées (vues/likes/commentaires par heure) sont conservées **25 mois maximum**, puis supprimées automatiquement.

## Tes droits, en un clic

Depuis les paramètres de ton compte, tu peux à tout moment :

- **Déconnecter une plateforme** individuellement — le jeton associé est immédiatement supprimé.
- **Tout déconnecter et effacer tes données** — un bouton "zone de danger" supprime en une action tous tes jetons et l'historique de statistiques associé à tes vidéos.

Le détail complet de ce qui est collecté, pourquoi, et pendant combien de temps, est public :

- 📄 [Politique de confidentialité](https://social-hub.fr/privacy)
- 📄 [Conditions d'utilisation](https://social-hub.fr/terms)
- 📄 [Suppression des données](https://social-hub.fr/delete-data)

## Cookies et mesure d'audience

Social Hub utilise **Matomo**, un outil de mesure d'audience auto-hébergé (pas Google Analytics, pas de partage de données avec un tiers publicitaire). Il ne se charge **qu'après ton consentement explicite**, via le bandeau affiché à la première visite — refusable et modifiable à tout moment depuis le pied de page ("Gérer les cookies").

<details>
<summary>🔧 Pour les développeurs — détails techniques</summary>

<br>

- **Chiffrement** : AES-256-GCM, clé applicative (`TOKENS_AES_KEY`), implémenté dans `lib/accountLinks.ts` — appliqué aux jetons OAuth de toutes les plateformes, dans l'unique table `AccountLink`. Chaque jeton est rattaché à un utilisateur : il n'existe plus de jeton partagé au niveau de l'application.
- **Autorisation applicative** : le middleware Next.js (`proxy.ts`) vérifie la permission Kinde `read:dashboard` sur les pages protégées (`/dashboard/*`, `/analytics/*`, `/settings/linked-accounts/*`) et applique un **refus par défaut à toute route sous `/api/`** : sans session, la requête n'atteint pas le handler. Font exception les chemins qui s'authentifient autrement — handler Kinde, flux OAuth (gardés route par route par `requireDashboardUser()`), snapshot horaire (`?key=CRON_SECRET`, comparaison en temps constant) et rappel de désautorisation Meta (signature HMAC).
- **Cloisonnement entre utilisateurs** : au-delà de la session, `/api/analytics/*` vérifie que la vidéo demandée appartient bien à un compte que l'utilisateur a lui-même relié, en réinterrogeant l'API de la plateforme — connaître l'identifiant d'une vidéo ne suffit pas à en obtenir les statistiques.
- **Double barrière sur les pages protégées** : au middleware s'ajoute, depuis septembre 2026, une vérification au moment du rendu. `/dashboard`, `/analytics` et `/settings/linked-accounts` ont chacun un `layout.tsx` qui exige une session Kinde valide et la permission `read:dashboard` avant d'afficher quoi que ce soit. Le middleware dépend de la liste des chemins qu'il surveille ; cette seconde garde est attachée aux fichiers eux-mêmes, elle suit la page où qu'elle aille.
- **En-têtes de sécurité** : Content-Security-Policy stricte avec nonce par requête, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS en production.
- **Rate limiting** : les routes API publiques sont limitées par IP pour limiter les abus.
- **Scopes OAuth minimaux** : chaque plateforme n'accorde que les autorisations strictement nécessaires à l'affichage des statistiques (ex. `youtube.readonly`, `yt-analytics.readonly` côté YouTube) — jamais de scope d'écriture ou de publication.
- **Sous-traitants** : hébergement applicatif (Vercel), base de données (Neon, région de Francfort), authentification (Kinde), et un VPS loué chez **Hostinger** qui déclenche le relevé horaire et héberge l'instance Matomo. La liste de référence reste celle de la politique de confidentialité publique.

</details>

---

<div align="center">

⬅️ [Architecture](03-architecture.md) · ➡️ [Intégrations API](05-integrations-api.md)

</div>
