// app/privacy/page.tsx
import type { Metadata } from "next";
import LegalDoc from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Social Hub",
  description:
    "Comment Social Hub collecte, utilise et protège vos données personnelles (RGPD).",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title={{
        fr: "Politique de confidentialité",
        en: "Privacy Policy",
      }}
      updated={{
        fr: "Dernière mise à jour : 10 septembre 2026",
        en: "Last updated: 10 September 2026",
      }}
      fr={<Fr />}
      en={<En />}
    />
  );
}

/* ------------------------------- Français ------------------------------- */

function Fr() {
  return (
    <>
      <p>
        La présente politique décrit comment <strong>Social Hub</strong>{" "}
        (<a href="https://social-hub.fr">social-hub.fr</a>) traite vos données personnelles,
        conformément au Règlement général sur la protection des données (RGPD) et à la loi
        «&nbsp;Informatique et Libertés&nbsp;».
      </p>

      <h2 id="responsable">1. Responsable du traitement</h2>
      <p>
        Paul Woisard — 4, avenue Marc Chagall, 37100 Tours, France —{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>. Aucun délégué à la
        protection des données (DPO) n’est désigné&nbsp;; vos demandes sont traitées
        directement à cette adresse.
      </p>

      <h2 id="donnees">2. Données que nous traitons</h2>
      <h3>2.1 Compte et authentification</h3>
      <p>
        L’authentification est assurée par <strong>Kinde</strong>. À ce titre nous recevons
        et conservons&nbsp;: votre identifiant Kinde, votre adresse e-mail, votre nom et
        prénom lorsqu’ils sont fournis, et le cas échéant votre photo de profil. Le mot de
        passe n’est jamais connu de Social Hub.
      </p>
      <h3>2.2 Comptes de plateformes que vous connectez</h3>
      <p>Lorsque vous reliez un compte YouTube, TikTok ou Instagram, nous stockons&nbsp;:</p>
      <ul>
        <li>
          les <strong>jetons d’accès et de rafraîchissement</strong> délivrés par la
          plateforme, <strong>chiffrés</strong>{" "}
          au repos (AES-256-GCM), afin d’appeler les API en votre nom&nbsp;;
        </li>
        <li>
          l’identifiant du compte/chaîne/page (par ex. <em>channel ID</em>, <em>open_id</em>,
          <em> Instagram user ID</em>, <em>Page ID</em>), le nom d’affichage ou nom
          d’utilisateur, les périmètres d’autorisation accordés et la date d’expiration du
          jeton.
        </li>
      </ul>
      <p>
        Les accès demandés sont en <strong>lecture seule</strong> (liste de vidéos et
        statistiques). Nous ne publions, ne modifions ni ne supprimons rien sur vos comptes.
      </p>
      <h3>2.3 Contenus et statistiques de vos vidéos</h3>
      <p>
        Nous récupérons via les API&nbsp;: titre, miniature, date de publication, lien, et
        indicateurs publics (vues, «&nbsp;j’aime&nbsp;», commentaires, partages). Un
        instantané horaire de ces indicateurs est enregistré pour vous fournir un
        historique d’évolution. Ces enregistrements ne contiennent que des données
        publiques&nbsp;: plateforme, identifiant de vidéo, horodatage et compteurs. Ils ne
        sont <strong>pas rattachés à votre identité</strong>{" "}
        ni à votre compte&nbsp;: une fois un compte déconnecté, il n’est plus possible de
        relier ces mesures à vous.
        Vous pouvez néanmoins supprimer cet historique à tout moment depuis la page{" "}
        <a href="/settings/linked-accounts">Comptes liés</a> (voir §8).
      </p>
      <h3>2.4 Données techniques</h3>
      <p>
        Nos hébergeurs génèrent des journaux techniques (adresse IP, horodatage, type de
        requête, agent utilisateur) utilisés pour la sécurité, la prévention des abus
        (limitation de débit) et le diagnostic d’incidents.
      </p>
      <h3>2.5 Mesure d’audience (Matomo)</h3>
      <p>
        Si — et seulement si — vous y consentez, notre instance <strong>Matomo</strong>{" "}
        auto-hébergée (<a href="https://stats.social-hub.fr">stats.social-hub.fr</a>,
        chargée via Matomo Tag Manager) enregistre des statistiques de navigation&nbsp;:
        pages vues, page de provenance,
        données approximatives d’appareil et de navigateur, localisation approximative
        déduite d’une adresse IP tronquée, date et heure. Ces données ne sont ni revendues
        ni transmises à des tiers, et ne servent pas à de la publicité.
      </p>

      <h2 id="finalites">3. Finalités et bases légales</h2>
      <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Finalité</th>
            <th>Base légale (RGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Créer votre compte, vous authentifier, fournir le tableau de bord</td>
            <td>Exécution du contrat (art. 6.1.b)</td>
          </tr>
          <tr>
            <td>Conserver les jetons pour interroger les API des plateformes connectées</td>
            <td>Exécution du contrat et votre consentement lors de la connexion (art. 6.1.b / 6.1.a)</td>
          </tr>
          <tr>
            <td>Historiser les statistiques de vos vidéos</td>
            <td>Intérêt légitime&nbsp;: vous offrir un suivi dans le temps (art. 6.1.f)</td>
          </tr>
          <tr>
            <td>Sécurité, prévention des abus, journaux</td>
            <td>Intérêt légitime (art. 6.1.f)</td>
          </tr>
          <tr>
            <td>Mesure d’audience du site</td>
            <td>Votre consentement (art. 6.1.a), révocable à tout moment</td>
          </tr>
        </tbody>
      </table>
      </div>

      <h2 id="destinataires">4. Destinataires et sous-traitants</h2>
      <ul>
        <li>
          <strong>Kinde</strong> (authentification) — <a href="https://kinde.com/privacy">politique</a>.
        </li>
        <li>
          <strong>Vercel Inc.</strong> (hébergement de l’application, États-Unis) —{" "}
          <a href="https://vercel.com/legal/privacy-policy">politique</a>.
        </li>
        <li>
          <strong>Neon, Inc.</strong> — base de données PostgreSQL managée, données
          hébergées dans la région AWS <em>eu-central-1</em> (Francfort, Union européenne) —{" "}
          <a href="https://neon.tech/privacy-policy">politique</a>.
        </li>
        <li>
          <strong>Google/YouTube, TikTok, Meta (Instagram)</strong>&nbsp;: vos
          jetons sont transmis à ces plateformes lors de chaque appel d’API que vous avez
          autorisé.
        </li>
        <li>
          <strong>Matomo</strong>&nbsp;: hébergé par nos soins, aucun tiers.
        </li>
      </ul>
      <p>
        Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.
      </p>

      <h2 id="transferts">5. Transferts hors Union européenne</h2>
      <p>
        La base de données est hébergée dans l’Union européenne (Neon, région de Francfort).
        En revanche, l’hébergement applicatif (Vercel), l’exploitant de la base (Neon, Inc.)
        et, le cas échéant, Kinde sont établis aux États-Unis, ce qui peut impliquer un
        transfert ou un accès depuis les États-Unis. Ces transferts sont encadrés par les
        clauses contractuelles types de la Commission européenne et/ou l’adhésion au{" "}
        <em>EU–US Data Privacy Framework</em>.
      </p>

      <h2 id="duree">6. Durées de conservation</h2>
      <ul>
        <li>
          <strong>Compte et comptes liés (jetons inclus)</strong>&nbsp;: jusqu’à la
          suppression de votre compte. Les jetons d’un compte que vous déconnectez sont
          effacés immédiatement.
        </li>
        <li>
          <strong>Historique de statistiques</strong>&nbsp;: <strong>purgé
          automatiquement au-delà de 25&nbsp;mois</strong>. Ces données publiques n’étant
          pas rattachées à votre identité, elles ne sont pas supprimées à la clôture d’un
          compte&nbsp;; vous pouvez toutefois les effacer{" "}
          <strong>immédiatement</strong> depuis la page{" "}
          <a href="/settings/linked-accounts">Comptes liés</a>, ou en demander la
          suppression par e-mail (voir §8).
        </li>
        <li>
          <strong>Journaux techniques</strong>&nbsp;: durée courte, selon la configuration
          de l’hébergeur (de l’ordre de 30&nbsp;jours).
        </li>
        <li>
          <strong>Matomo</strong>&nbsp;: cookies de mesure jusqu’à 13&nbsp;mois&nbsp;;
          données de visite conservées au maximum 25&nbsp;mois.
        </li>
        <li>
          <strong>Preuve de votre choix de cookies</strong>&nbsp;: 6&nbsp;mois, puis la
          question vous est reposée.
        </li>
      </ul>

      <h2 id="cookies">7. Cookies et traceurs</h2>
      <p>Social Hub utilise&nbsp;:</p>
      <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Cookie / traceur</th>
            <th>Finalité</th>
            <th>Durée</th>
            <th>Consentement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cookies de session Kinde</td>
            <td>Vous maintenir connecté·e</td>
            <td>Session</td>
            <td>Exempté (nécessaire)</td>
          </tr>
          <tr>
            <td><code>oauth_state</code>, <code>tiktok_pkce</code></td>
            <td>Sécurité des connexions OAuth (anti-CSRF / PKCE)</td>
            <td>10 minutes</td>
            <td>Exempté (nécessaire)</td>
          </tr>
          <tr>
            <td><code>sh_consent</code></td>
            <td>Mémoriser votre choix de cookies</td>
            <td>6 mois</td>
            <td>Exempté (nécessaire)</td>
          </tr>
          <tr>
            <td><code>sh_legal_lang</code> (stockage local)</td>
            <td>Mémoriser la langue des pages légales</td>
            <td>Persistant (navigateur)</td>
            <td>Exempté (nécessaire)</td>
          </tr>
          <tr>
            <td>Cookies Matomo &amp; Tag Manager (<code>_pk_id</code>, <code>_pk_ses</code>, <code>mtm_*</code>…)</td>
            <td>Mesure d’audience</td>
            <td>Jusqu’à 13 mois</td>
            <td>Soumis à votre consentement</td>
          </tr>
        </tbody>
      </table>
      </div>
      <p>
        Lors de votre première visite, un bandeau vous permet de <strong>tout accepter</strong>,{" "}
        <strong>tout refuser</strong> ou <strong>personnaliser</strong> vos choix. Vous
        pouvez modifier votre décision à tout moment via le lien{" "}
        <strong>«&nbsp;Gérer les cookies&nbsp;»</strong> en bas de chaque page. Refuser
        n’empêche pas l’utilisation du service.
      </p>

      <h2 id="droits">8. Vos droits</h2>
      <p>
        Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, de
        portabilité et d’opposition, ainsi que du droit de retirer votre consentement à tout
        moment (sans effet rétroactif) et de définir des directives relatives au sort de vos
        données après votre décès.
      </p>
      <p>
        Pour les exercer&nbsp;: écrivez à{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>. Une réponse vous
        est apportée dans un délai d’un mois. Vous pouvez aussi, sans nous écrire&nbsp;:
      </p>
      <ul>
        <li>déconnecter un compte depuis <a href="/settings/linked-accounts">Comptes liés</a>&nbsp;;</li>
        <li>
          sur cette même page, utiliser le bouton{" "}
          <strong>«&nbsp;Tout déconnecter et supprimer mes données&nbsp;»</strong>{" "}
          (zone de danger)&nbsp;: après avoir recopié la phrase de confirmation, tous vos
          comptes liés et l’historique de statistiques de vos vidéos sont effacés
          immédiatement de notre base&nbsp;;
        </li>
        <li>
          consulter la page <a href="/delete-data">Suppression des données</a> pour la
          suppression complète de votre compte (identité Kinde).
        </li>
      </ul>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
        réclamation auprès de la <a href="https://www.cnil.fr">CNIL</a> (3 place de
        Fontenoy, TSA 80715, 75334 Paris Cedex 07).
      </p>

      <h2 id="securite">9. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures adaptées&nbsp;: HTTPS et HSTS, en-têtes de
        sécurité (CSP, anti-clickjacking), chiffrement des jetons au repos (AES-256-GCM),
        périmètres d’autorisation minimaux en lecture seule, accès aux données restreint à
        l’éditeur.
      </p>

      <h2 id="mineurs">10. Mineurs</h2>
      <p>
        Le service n’est pas destiné aux personnes de moins de 15 ans. Si vous pensez qu’un
        mineur nous a transmis des données sans autorisation, contactez-nous pour leur
        suppression.
      </p>

      <h2 id="decisions">11. Décisions automatisées</h2>
      <p>
        Aucune décision produisant des effets juridiques n’est prise de manière
        exclusivement automatisée. Aucun profilage n’est réalisé.
      </p>

      <h2 id="modifications">12. Modifications</h2>
      <p>
        Cette politique peut évoluer. En cas de changement substantiel, une information sera
        affichée sur le site. La date de dernière mise à jour figure en haut de page.
      </p>
    </>
  );
}

/* -------------------------------- English -------------------------------- */

function En() {
  return (
    <>
      <p>
        This policy explains how <strong>Social Hub</strong>{" "}
        (<a href="https://social-hub.fr">social-hub.fr</a>) processes your personal data, in
        accordance with the EU General Data Protection Regulation (GDPR) and the French Data
        Protection Act.
      </p>

      <h2 id="controller">1. Data controller</h2>
      <p>
        Paul Woisard — 4, avenue Marc Chagall, 37100 Tours, France —{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>. No Data Protection
        Officer has been appointed; your requests are handled directly at this address.
      </p>

      <h2 id="data">2. Data we process</h2>
      <h3>2.1 Account and authentication</h3>
      <p>
        Authentication is handled by <strong>Kinde</strong>. We therefore receive and store:
        your Kinde identifier, your e-mail address, your first and last name where provided,
        and where applicable your profile picture. Social Hub never has access to your
        password.
      </p>
      <h3>2.2 Platform accounts you connect</h3>
      <p>When you link a YouTube, TikTok or Instagram account, we store:</p>
      <ul>
        <li>
          the <strong>access and refresh tokens</strong> issued by the platform,{" "}
          <strong>encrypted</strong>{" "}
          at rest (AES-256-GCM), so that we can call the APIs on your behalf;
        </li>
        <li>
          the account/channel/page identifier (e.g. <em>channel ID</em>, <em>open_id</em>,{" "}
          <em>Instagram user ID</em>, <em>Page ID</em>), the display name or username, the
          granted permission scopes and the token expiry date.
        </li>
      </ul>
      <p>
        The access requested is <strong>read-only</strong> (video list and statistics). We
        never post, modify or delete anything on your accounts.
      </p>
      <h3>2.3 Your videos’ content and statistics</h3>
      <p>
        Through the APIs we retrieve: title, thumbnail, publication date, link, and public
        metrics (views, likes, comments, shares). An hourly snapshot of those metrics is
        stored to give you a history over time. These records contain public data only:
        platform, video identifier, timestamp and counters. They are{" "}
        <strong>not linked to your identity</strong>{" "}
        or your account: once an account is disconnected, these measurements can no longer
        be tied back to you. You can still delete this history at any time from the{" "}
        <a href="/settings/linked-accounts">Linked accounts</a> page (see §8).
      </p>
      <h3>2.4 Technical data</h3>
      <p>
        Our hosting providers generate technical logs (IP address, timestamp, request type,
        user agent) used for security, abuse prevention (rate limiting) and incident
        diagnosis.
      </p>
      <h3>2.5 Audience measurement (Matomo)</h3>
      <p>
        If — and only if — you consent, our self-hosted <strong>Matomo</strong> instance
        (<a href="https://stats.social-hub.fr">stats.social-hub.fr</a>, loaded via Matomo
        Tag Manager) records browsing statistics: pages viewed, referring page, approximate
        device and browser data,
        approximate location derived from a truncated IP address, date and time. This data
        is neither sold nor shared with third parties and is not used for advertising.
      </p>

      <h2 id="purposes">3. Purposes and legal bases</h2>
      <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal basis (GDPR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Create your account, authenticate you, provide the dashboard</td>
            <td>Performance of a contract (Art. 6(1)(b))</td>
          </tr>
          <tr>
            <td>Keep tokens to query the connected platforms’ APIs</td>
            <td>Performance of a contract and your consent when connecting (Art. 6(1)(b) / 6(1)(a))</td>
          </tr>
          <tr>
            <td>Keep a history of your videos’ statistics</td>
            <td>Legitimate interest: providing you with monitoring over time (Art. 6(1)(f))</td>
          </tr>
          <tr>
            <td>Security, abuse prevention, logs</td>
            <td>Legitimate interest (Art. 6(1)(f))</td>
          </tr>
          <tr>
            <td>Website audience measurement</td>
            <td>Your consent (Art. 6(1)(a)), revocable at any time</td>
          </tr>
        </tbody>
      </table>
      </div>

      <h2 id="recipients">4. Recipients and processors</h2>
      <ul>
        <li>
          <strong>Kinde</strong> (authentication) — <a href="https://kinde.com/privacy">policy</a>.
        </li>
        <li>
          <strong>Vercel Inc.</strong> (application hosting, USA) —{" "}
          <a href="https://vercel.com/legal/privacy-policy">policy</a>.
        </li>
        <li>
          <strong>Neon, Inc.</strong> — managed PostgreSQL database, data hosted in the AWS{" "}
          <em>eu-central-1</em> region (Frankfurt, European Union) —{" "}
          <a href="https://neon.tech/privacy-policy">policy</a>.
        </li>
        <li>
          <strong>Google/YouTube, TikTok, Meta (Instagram)</strong>: your tokens
          are sent to these platforms on every API call you have authorized.
        </li>
        <li>
          <strong>Matomo</strong>: hosted by us, no third party.
        </li>
      </ul>
      <p>We do not sell your data and do not use it for advertising.</p>

      <h2 id="transfers">5. Transfers outside the European Union</h2>
      <p>
        The database is hosted within the European Union (Neon, Frankfurt region). However,
        application hosting (Vercel), the database operator (Neon, Inc.) and, where
        applicable, Kinde are established in the United States, which may involve a transfer
        or access from the United States. Such transfers are governed by the European
        Commission’s Standard Contractual Clauses and/or certification under the{" "}
        <em>EU–US Data Privacy Framework</em>.
      </p>

      <h2 id="retention">6. Retention periods</h2>
      <ul>
        <li>
          <strong>Account and linked accounts (including tokens)</strong>: until you delete
          your account. Tokens for an account you disconnect are erased immediately.
        </li>
        <li>
          <strong>Statistics history</strong>: <strong>automatically purged beyond 25
          months</strong>. As this public data is not linked to your identity, it is not
          deleted when an account is closed; you can however erase it{" "}
          <strong>immediately</strong> from the{" "}
          <a href="/settings/linked-accounts">Linked accounts</a> page, or request its
          deletion by e-mail (see §8).
        </li>
        <li>
          <strong>Technical logs</strong>: short period, per the hosting provider’s
          configuration (around 30 days).
        </li>
        <li>
          <strong>Matomo</strong>: measurement cookies up to 13 months; visit data kept for
          a maximum of 25 months.
        </li>
        <li>
          <strong>Record of your cookie choice</strong>: 6 months, after which you are asked
          again.
        </li>
      </ul>

      <h2 id="cookies">7. Cookies and trackers</h2>
      <p>Social Hub uses:</p>
      <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Cookie / tracker</th>
            <th>Purpose</th>
            <th>Duration</th>
            <th>Consent</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kinde session cookies</td>
            <td>Keep you signed in</td>
            <td>Session</td>
            <td>Exempt (necessary)</td>
          </tr>
          <tr>
            <td><code>oauth_state</code>, <code>tiktok_pkce</code></td>
            <td>OAuth sign-in security (anti-CSRF / PKCE)</td>
            <td>10 minutes</td>
            <td>Exempt (necessary)</td>
          </tr>
          <tr>
            <td><code>sh_consent</code></td>
            <td>Remember your cookie choice</td>
            <td>6 months</td>
            <td>Exempt (necessary)</td>
          </tr>
          <tr>
            <td><code>sh_legal_lang</code> (local storage)</td>
            <td>Remember the language of the legal pages</td>
            <td>Persistent (browser)</td>
            <td>Exempt (necessary)</td>
          </tr>
          <tr>
            <td>Matomo &amp; Tag Manager cookies (<code>_pk_id</code>, <code>_pk_ses</code>, <code>mtm_*</code>…)</td>
            <td>Audience measurement</td>
            <td>Up to 13 months</td>
            <td>Subject to your consent</td>
          </tr>
        </tbody>
      </table>
      </div>
      <p>
        On your first visit, a banner lets you <strong>accept all</strong>,{" "}
        <strong>reject all</strong> or <strong>customize</strong> your choices. You can
        change your decision at any time via the <strong>“Manage cookies”</strong> link at
        the bottom of every page. Refusing does not prevent you from using the service.
      </p>

      <h2 id="rights">8. Your rights</h2>
      <p>
        You have the rights of access, rectification, erasure, restriction, portability and
        objection, as well as the right to withdraw your consent at any time (without
        retroactive effect) and to give instructions regarding your data after your death.
      </p>
      <p>
        To exercise them: write to{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>. We reply within
        one month. You can also, without contacting us:
      </p>
      <ul>
        <li>disconnect an account from <a href="/settings/linked-accounts">Linked accounts</a>;</li>
        <li>
          on that same page, use the{" "}
          <strong>“Disconnect everything and delete my data”</strong> button (danger zone):
          after retyping the confirmation phrase, all your linked accounts and your videos’
          statistics history are erased from our database immediately;
        </li>
        <li>
          see the <a href="/delete-data">Data deletion</a> page for full deletion of your
          account (Kinde identity).
        </li>
      </ul>
      <p>
        If you believe your rights are not being respected, you may lodge a complaint with
        the French supervisory authority, the <a href="https://www.cnil.fr">CNIL</a> (3
        place de Fontenoy, TSA 80715, 75334 Paris Cedex 07).
      </p>

      <h2 id="security">9. Security</h2>
      <p>
        We implement appropriate measures: HTTPS and HSTS, security headers (CSP,
        anti-clickjacking), encryption of tokens at rest (AES-256-GCM), minimal read-only
        authorization scopes, and data access restricted to the publisher.
      </p>

      <h2 id="minors">10. Minors</h2>
      <p>
        The service is not intended for people under 15. If you believe a minor has provided
        us with data without authorization, contact us for its deletion.
      </p>

      <h2 id="automated">11. Automated decisions</h2>
      <p>
        No decision producing legal effects is made on a solely automated basis. No
        profiling is carried out.
      </p>

      <h2 id="changes">12. Changes</h2>
      <p>
        This policy may change. In the event of a substantial change, a notice will be
        displayed on the site. The last-updated date is shown at the top of the page.
      </p>
    </>
  );
}
