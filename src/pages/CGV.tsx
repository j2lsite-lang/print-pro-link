import { Link } from "react-router-dom";

export default function CGV() {
  return (
    <section className="py-12">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Conditions Générales de Vente</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 1 — Objet et champ d'application</h2>
            <p>Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des relations commerciales entre :</p>
            <p><strong className="text-foreground">J2L Publicité</strong><br />22 B rue Robert Barret, 88390 Uxegney, France<br />SIRET : 508 858 784 00046 — RCS Épinal<br />TVA intracommunautaire : FR64 508 858 784<br />Tél : <a href="tel:+33329304479" className="text-primary hover:underline">03 29 30 44 79</a><br />E-mail : <a href="mailto:contact@j2lprint.fr" className="text-primary hover:underline">contact@j2lprint.fr</a></p>
            <p>Et ses clients professionnels ou particuliers (ci-après « le Client »).</p>
            <p>Toute commande implique l'acceptation sans réserve des présentes CGV qui prévalent sur tout autre document du Client.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 2 — Commandes</h2>
            <p>Les commandes ne sont définitives qu'après acceptation écrite de J2L Publicité (email, courrier, bon de commande signé) et réception du règlement ou de l'acompte convenu.</p>
            <p>Toute demande de modification ou d'annulation doit être formulée par écrit et sera soumise à notre accord. Des frais pourront être appliqués si la production a déjà débuté.</p>
            <p>Le Client est responsable de la vérification des éléments transmis (textes, logos, visuels) avant validation du bon à tirer (BAT).</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 3 — Prix et facturation</h2>
            <p>Les prix sont indiqués en euros hors taxes (HT). La TVA applicable sera ajoutée au taux en vigueur à la date de facturation.</p>
            <p>Les frais de transport, d'emballage et de livraison sont facturés en sus, sauf mention contraire sur le devis.</p>
            <p>J2L Publicité se réserve le droit de modifier ses prix à tout moment. Les prix applicables sont ceux en vigueur au moment de la validation de la commande.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 4 — Modalités de paiement</h2>
            <p>Sauf accord particulier, le règlement s'effectue comme suit :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acompte de 50% à la commande</li>
              <li>Solde à la livraison ou à 30 jours fin de mois selon accord</li>
            </ul>
            <p>Modes de paiement acceptés : virement bancaire, chèque, carte bancaire.</p>
            <p>Tout retard de paiement entraînera de plein droit, et sans mise en demeure préalable, l'application de pénalités de retard calculées au taux d'intérêt appliqué par la Banque Centrale Européenne majoré de 10 points de pourcentage (article L441-10 du Code de commerce), ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (article D441-5 du Code de commerce).</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 5 — Livraison</h2>
            <p>Les délais de livraison sont donnés à titre indicatif et ne sont pas contractuels. Un retard de livraison ne peut donner lieu à aucune pénalité, retenue ou annulation de commande, sauf en cas de retard excessif au sens de l'article L216-2 du Code de la consommation.</p>
            <p>La marchandise voyage aux risques et périls du destinataire. En cas de dommage apparent, le Client doit émettre des réserves précises et motivées sur le bon de livraison et nous en informer sous 48 heures par écrit.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 6 — Droit de rétractation</h2>
            <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation de 14 jours <strong className="text-foreground">ne s'applique pas</strong> aux produits personnalisés ou fabriqués selon les spécifications du consommateur (impression, broderie, gravure, etc.).</p>
            <p>Pour les produits non personnalisés en stock (sans marquage), le client consommateur dispose d'un délai de rétractation de 14 jours à compter de la réception du produit, conformément aux articles L221-18 et suivants du Code de la consommation. Les produits doivent être retournés dans leur état d'origine, non utilisés et dans leur emballage d'origine. Les frais de retour sont à la charge du Client.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 7 — Réclamations et retours</h2>
            <p>Toute réclamation concernant la conformité ou la qualité des produits livrés doit être formulée par écrit dans les 48 heures suivant la réception, accompagnée de photos si nécessaire.</p>
            <p>Les retours ne sont acceptés qu'après accord préalable de J2L Publicité. Les produits personnalisés ne peuvent faire l'objet de retour sauf en cas de défaut de fabrication.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 8 — Garanties légales</h2>
            <p>Le Client bénéficie des garanties légales prévues par le Code de la consommation :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Garantie légale de conformité</strong> (articles L217-3 à L217-20 du Code de la consommation) : le Client dispose d'un délai de 2 ans à compter de la délivrance du bien pour agir. Il peut choisir entre la réparation ou le remplacement du bien, sous réserve des conditions de coût prévues par l'article L217-12. Il est dispensé de rapporter la preuve de l'existence du défaut de conformité du bien durant les 24 mois suivant la délivrance du bien.</li>
              <li><strong className="text-foreground">Garantie légale des vices cachés</strong> (articles 1641 à 1649 du Code civil) : le Client peut demander la résolution de la vente ou une réduction du prix en cas de vice caché rendant le bien impropre à l'usage auquel il est destiné.</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 9 — Propriété intellectuelle</h2>
            <p>Le Client garantit détenir les droits de reproduction des éléments fournis (logos, textes, images, marques). Il garantit J2L Publicité contre toute action de tiers relative à la propriété intellectuelle.</p>
            <p>Les créations graphiques réalisées par J2L Publicité restent sa propriété jusqu'au paiement intégral de la commande.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 10 — Réserve de propriété</h2>
            <p>J2L Publicité conserve la propriété des marchandises vendues jusqu'au paiement intégral du prix, en principal et accessoires. Le non-paiement peut entraîner la revendication des marchandises (article 2367 du Code civil).</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 11 — Protection des données personnelles</h2>
            <p>J2L Publicité s'engage à protéger les données personnelles du Client conformément au RGPD. Pour plus d'informations, consultez notre <Link to="/politique-confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 12 — Médiation de la consommation</h2>
            <p>Conformément aux articles L.611-1 et R.612-1 du Code de la consommation, en cas de litige non résolu par notre service client, le Client consommateur peut recourir gratuitement au service de médiation :</p>
            <p><strong className="text-foreground">CM2C — Centre de Médiation de la Consommation de Conciliateurs de Justice</strong></p>
            <p>14 rue Saint Jean, 75017 Paris</p>
            <p>Site web : <a href="https://www.cm2c.net" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.cm2c.net</a></p>
            <p className="text-xs mt-1">Plateforme européenne de règlement en ligne des litiges : <a href="https://ec.europa.eu/consumers/odr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a></p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 13 — Droit applicable et litiges</h2>
            <p>Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut d'accord amiable et après recours à la médiation, les tribunaux d'Épinal (88) seront seuls compétents pour tout litige avec un client professionnel.</p>
            <p>Pour les clients consommateurs, les tribunaux compétents sont ceux du lieu de domicile du défendeur ou, au choix du demandeur, du lieu de livraison effective du bien (article R631-3 du Code de procédure civile).</p>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Dernière mise à jour : février 2025
          </p>
        </div>
      </div>
    </section>
  );
}