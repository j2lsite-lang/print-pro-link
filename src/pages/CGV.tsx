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
            <p><strong className="text-foreground">J2L Publicité</strong><br />22 B rue Robert Barret, 88390 Uxegney, France<br />SIRET : 508 858 784 00046 — RCS Épinal<br />Tél : <a href="tel:+33329304479" className="text-primary hover:underline">03 29 30 44 79</a><br />E-mail : <a href="mailto:contact@j2lpublicite.fr" className="text-primary hover:underline">contact@j2lpublicite.fr</a></p>
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
            <p>Tout retard de paiement entraînera l'application de pénalités de retard au taux légal en vigueur, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40€.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 5 — Livraison</h2>
            <p>Les délais de livraison sont donnés à titre indicatif et ne sont pas contractuels. Un retard de livraison ne peut donner lieu à aucune pénalité, retenue ou annulation de commande.</p>
            <p>La marchandise voyage aux risques et périls du destinataire. En cas de dommage apparent, le Client doit émettre des réserves précises et motivées sur le bon de livraison et nous en informer sous 48 heures.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 6 — Réclamations et retours</h2>
            <p>Toute réclamation concernant la conformité ou la qualité des produits livrés doit être formulée par écrit dans les 48 heures suivant la réception, accompagnée de photos si nécessaire.</p>
            <p>Les retours ne sont acceptés qu'après accord préalable de J2L Publicité. Les produits personnalisés ne peuvent faire l'objet de retour sauf en cas de défaut de fabrication.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 7 — Propriété intellectuelle</h2>
            <p>Le Client garantit détenir les droits de reproduction des éléments fournis (logos, textes, images, marques). Il garantit J2L Publicité contre toute action de tiers relative à la propriété intellectuelle.</p>
            <p>Les créations graphiques réalisées par J2L Publicité restent sa propriété jusqu'au paiement intégral de la commande.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 8 — Réserve de propriété</h2>
            <p>J2L Publicité conserve la propriété des marchandises vendues jusqu'au paiement intégral du prix. Le non-paiement peut entraîner la revendication des marchandises.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Article 9 — Litiges</h2>
            <p>Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée. À défaut d'accord, les tribunaux d'Épinal (88) seront seuls compétents.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
