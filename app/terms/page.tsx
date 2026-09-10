// app/terms/page.tsx
import type { Metadata } from "next";
import LegalDoc from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Mentions légales & Conditions d'utilisation — Social Hub",
  description:
    "Mentions légales et conditions générales d'utilisation du service Social Hub.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title={{
        fr: "Mentions légales & Conditions générales d’utilisation",
        en: "Legal notice & Terms of Service",
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
      <h2 id="editeur">1. Éditeur du site</h2>
      <p>
        Le site <strong>Social Hub</strong>, accessible à l’adresse{" "}
        <a href="https://social-hub.fr">https://social-hub.fr</a>, est édité par&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Paul Woisard</strong>, personne physique agissant à titre non professionnel
        </li>
        <li>Adresse&nbsp;: 4, avenue Marc Chagall, 37100 Tours, France</li>
        <li>
          Contact&nbsp;: <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>
        </li>
        <li>Directeur de la publication&nbsp;: Paul Woisard</li>
      </ul>
      <p>
        Social Hub est un projet personnel proposé gratuitement&nbsp;; il ne donne lieu à
        aucune facturation et n’a pas de finalité commerciale. À ce titre, l’éditeur ne
        dispose pas de numéro SIRET.
      </p>

      <h2 id="hebergement">2. Hébergement</h2>
      <ul>
        <li>
          <strong>Application&nbsp;:</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut,
          CA 91789, États-Unis — <a href="https://vercel.com">vercel.com</a>.
        </li>
        <li>
          <strong>Base de données&nbsp;:</strong> Prisma Postgres (Prisma Data, Inc.),
          base PostgreSQL managée fournie via l’intégration Vercel Marketplace —{" "}
          <a href="https://www.prisma.io/privacy">prisma.io/privacy</a>.
        </li>
        <li>
          <strong>Mesure d’audience&nbsp;:</strong> instance Matomo auto-hébergée par
          l’éditeur, accessible à <a href="https://stats.social-hub.fr">stats.social-hub.fr</a>.
        </li>
      </ul>

      <h2 id="objet">3. Objet du service</h2>
      <p>
        Social Hub est un tableau de bord qui agrège, au même endroit, les vidéos publiées
        par l’utilisateur sur ses propres comptes YouTube, TikTok, Instagram et Facebook,
        ainsi que leurs indicateurs de performance publics (vues, «&nbsp;j’aime&nbsp;»,
        commentaires, partages). Le service est fourni à des fins d’information et de suivi
        personnel.
      </p>

      <h2 id="acces">4. Accès et compte</h2>
      <p>
        L’accès aux fonctionnalités nécessite la création d’un compte via notre prestataire
        d’authentification <strong>Kinde</strong>. Vous êtes responsable de la
        confidentialité de vos identifiants et de toute activité réalisée depuis votre
        compte. Le service est réservé à un usage personnel et non commercial.
      </p>

      <h2 id="comptes-tiers">5. Connexion de comptes tiers</h2>
      <p>
        Pour afficher vos vidéos, vous connectez vos comptes de plateformes via les
        mécanismes officiels d’autorisation (OAuth 2.0). Vous déclarez être titulaire des
        comptes connectés ou dûment autorisé à les utiliser. Social Hub accède à ces
        comptes <strong>en lecture seule</strong>{" "}
        et ne publie, ne modifie ni ne supprime jamais de contenu. Vous pouvez révoquer cet
        accès à tout moment depuis la page
        «&nbsp;Comptes liés&nbsp;» ou depuis les réglages du compte concerné (Google,
        TikTok, Meta).
      </p>
      <p>
        L’utilisation des API YouTube est également soumise aux{" "}
        <a href="https://www.youtube.com/t/terms">Conditions d’utilisation de YouTube</a> et
        à la <a href="https://policies.google.com/privacy">Politique de confidentialité de Google</a>.
        Les intégrations TikTok et Meta sont soumises aux conditions respectives de ces
        plateformes.
      </p>

      <h2 id="propriete">6. Propriété intellectuelle</h2>
      <p>
        Le code, l’interface et les éléments graphiques de Social Hub sont la propriété de
        l’éditeur ou sont utilisés avec l’autorisation de leurs titulaires. Les contenus
        (vidéos, miniatures, textes) affichés via les API restent la propriété de leurs
        auteurs et des plateformes d’origine. Le projet est distribué sous licence MIT&nbsp;;
        les marques citées (YouTube, TikTok, Instagram, Facebook, Kinde, Matomo, Vercel)
        appartiennent à leurs titulaires respectifs.
      </p>

      <h2 id="disponibilite">7. Disponibilité et responsabilité</h2>
      <p>
        Le service est fourni «&nbsp;en l’état&nbsp;», sans garantie de disponibilité, de
        continuité ni d’absence d’erreur. L’éditeur peut suspendre, limiter ou interrompre
        le service à tout moment, notamment pour maintenance ou en cas d’évolution des API
        tierces. Dans les limites permises par la loi, la responsabilité de l’éditeur ne
        saurait être engagée pour les dommages indirects, la perte de données ou
        l’indisponibilité des plateformes tierces.
      </p>

      <h2 id="donnees">8. Données personnelles</h2>
      <p>
        Le traitement de vos données personnelles est décrit dans notre{" "}
        <a href="/privacy">Politique de confidentialité</a>. Les modalités de suppression
        sont détaillées sur la page{" "}
        <a href="/delete-data">Suppression des données</a>.
      </p>

      <h2 id="resiliation">9. Durée et résiliation</h2>
      <p>
        Vous pouvez cesser d’utiliser le service à tout moment, déconnecter vos comptes
        liés et demander la suppression de votre compte et de vos données. L’éditeur peut
        clôturer un compte en cas de manquement aux présentes conditions ou d’usage
        contraire à la loi.
      </p>

      <h2 id="evolution">10. Modification des conditions</h2>
      <p>
        Les présentes conditions peuvent être modifiées à tout moment. La version
        applicable est celle en ligne à la date de votre utilisation&nbsp;; la date de
        dernière mise à jour figure en haut de cette page.
      </p>

      <h2 id="droit">11. Droit applicable</h2>
      <p>
        Les présentes conditions sont régies par le droit français. En cas de litige, et à
        défaut de résolution amiable après une réclamation adressée à{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>, les tribunaux
        français sont compétents.
      </p>
    </>
  );
}

/* -------------------------------- English -------------------------------- */

function En() {
  return (
    <>
      <h2 id="publisher">1. Site publisher</h2>
      <p>
        The <strong>Social Hub</strong> website, available at{" "}
        <a href="https://social-hub.fr">https://social-hub.fr</a>, is published by:
      </p>
      <ul>
        <li>
          <strong>Paul Woisard</strong>, an individual acting in a non-professional capacity
        </li>
        <li>Address: 4, avenue Marc Chagall, 37100 Tours, France</li>
        <li>
          Contact: <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>
        </li>
        <li>Publication director: Paul Woisard</li>
      </ul>
      <p>
        Social Hub is a personal project offered free of charge; it involves no billing and
        has no commercial purpose. Accordingly, the publisher has no business registration
        number.
      </p>

      <h2 id="hosting">2. Hosting</h2>
      <ul>
        <li>
          <strong>Application:</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA
          91789, USA — <a href="https://vercel.com">vercel.com</a>.
        </li>
        <li>
          <strong>Database:</strong> Prisma Postgres (Prisma Data, Inc.), a managed
          PostgreSQL database provided through the Vercel Marketplace integration —{" "}
          <a href="https://www.prisma.io/privacy">prisma.io/privacy</a>.
        </li>
        <li>
          <strong>Analytics:</strong> a Matomo instance self-hosted by the publisher at{" "}
          <a href="https://stats.social-hub.fr">stats.social-hub.fr</a>.
        </li>
      </ul>

      <h2 id="purpose">3. Purpose of the service</h2>
      <p>
        Social Hub is a dashboard that brings together, in one place, the videos published
        by the user on their own YouTube, TikTok, Instagram and Facebook accounts, along
        with their public performance metrics (views, likes, comments, shares). The service
        is provided for personal information and monitoring purposes.
      </p>

      <h2 id="access">4. Access and account</h2>
      <p>
        Access to the features requires creating an account through our authentication
        provider <strong>Kinde</strong>. You are responsible for keeping your credentials
        confidential and for any activity carried out from your account. The service is
        intended for personal, non-commercial use only.
      </p>

      <h2 id="third-party">5. Connecting third-party accounts</h2>
      <p>
        To display your videos, you connect your platform accounts through official
        authorization mechanisms (OAuth 2.0). You represent that you own the connected
        accounts or are duly authorized to use them. Social Hub accesses those accounts on
        a <strong>read-only</strong>{" "}
        basis and never posts, edits or deletes content. You may revoke this access at any
        time from the “Linked accounts” page or from the
        settings of the relevant account (Google, TikTok, Meta).
      </p>
      <p>
        Use of the YouTube API Services is also subject to the{" "}
        <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a> and the{" "}
        <a href="https://policies.google.com/privacy">Google Privacy Policy</a>. The TikTok
        and Meta integrations are subject to those platforms’ respective terms.
      </p>

      <h2 id="ip">6. Intellectual property</h2>
      <p>
        The code, interface and graphic elements of Social Hub are owned by the publisher or
        used with the permission of their owners. Content (videos, thumbnails, text)
        displayed through the APIs remains the property of its authors and of the source
        platforms. The project is distributed under the MIT license; the trademarks
        mentioned (YouTube, TikTok, Instagram, Facebook, Kinde, Matomo, Vercel) belong to
        their respective owners.
      </p>

      <h2 id="availability">7. Availability and liability</h2>
      <p>
        The service is provided “as is”, without warranty of availability, continuity or
        freedom from error. The publisher may suspend, limit or discontinue the service at
        any time, in particular for maintenance or where third-party APIs change. To the
        extent permitted by law, the publisher shall not be liable for indirect damages,
        loss of data or the unavailability of third-party platforms.
      </p>

      <h2 id="data">8. Personal data</h2>
      <p>
        The processing of your personal data is described in our{" "}
        <a href="/privacy">Privacy Policy</a>. Deletion procedures are detailed on the{" "}
        <a href="/delete-data">Data deletion</a> page.
      </p>

      <h2 id="termination">9. Term and termination</h2>
      <p>
        You may stop using the service at any time, disconnect your linked accounts and
        request deletion of your account and data. The publisher may close an account in
        the event of a breach of these terms or unlawful use.
      </p>

      <h2 id="changes">10. Changes to the terms</h2>
      <p>
        These terms may be amended at any time. The applicable version is the one online at
        the date of your use; the last-updated date is shown at the top of this page.
      </p>

      <h2 id="law">11. Governing law</h2>
      <p>
        These terms are governed by French law. In the event of a dispute, and failing an
        amicable resolution after a complaint sent to{" "}
        <a href="mailto:paulwoisard@gmail.com">paulwoisard@gmail.com</a>, the French courts
        shall have jurisdiction.
      </p>
    </>
  );
}
