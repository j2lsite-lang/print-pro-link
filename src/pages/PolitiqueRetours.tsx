import { Link } from "react-router-dom";

export default function PolitiqueRetours() {
  return (
    <section className="py-12">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Retours et remboursements</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card p-4 text-center">
              <p className="font-semibold text-foreground">Retours acceptés</p>
              <p className="text-xs mt-1">Produits défectueux ou non conformes</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="font-semibold text-foreground">Délai de réclamation</p>
              <p className="text-xs mt-1">48 heures après réception</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="font-semibold text-foreground">Non retournables</p>
              <p className="text-xs mt-1">Produits personnalisés conformes</p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Politique de retours</h2>
            <p>En raison de la nature personnalisée de nos produits (marquage, impression, broderie), les conditions de retour diffèrent des ventes classiques. Nous nous engageons cependant à garantir votre satisfaction.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Cas de retour acceptés</h2>
            <h3 className="font-semibold text-foreground mt-2">Produits défectueux</h3>
            <p>Si le produit présente un défaut de fabrication (défaut d'impression, broderie incorrecte, produit endommagé), nous procédons au remplacement ou au remboursement.</p>
            <h3 className="font-semibold text-foreground mt-2">Non-conformité à la commande</h3>
            <p>Si le produit livré ne correspond pas au bon à tirer (BAT) validé (couleur, texte, emplacement différents), nous reprenons les produits et effectuons une nouvelle production.</p>
            <h3 className="font-semibold text-foreground mt-2">Erreur de livraison</h3>
            <p>Si vous recevez un produit qui ne correspond pas à votre commande, contactez-nous immédiatement pour organiser l'échange.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Cas de retour non acceptés</h2>
            <p>Les produits personnalisés conformes au bon à tirer validé par le client ne peuvent pas être retournés. C'est pourquoi nous vous demandons de vérifier attentivement le BAT avant validation.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Procédure de retour</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong className="text-foreground">Signalement sous 48h :</strong> Contactez-nous par email à <a href="mailto:contact@j2lprint.fr" className="text-primary hover:underline">contact@j2lprint.fr</a> ou par téléphone au <a href="tel:+33329304479" className="text-primary hover:underline">03 29 30 44 79</a> dans les 48 heures suivant la réception.</li>
              <li><strong className="text-foreground">Description du problème :</strong> Joignez des photos du produit concerné et décrivez précisément le défaut ou la non-conformité.</li>
              <li><strong className="text-foreground">Validation du retour :</strong> Nous vous confirmons l'acceptation du retour et vous communiquons les instructions d'envoi.</li>
              <li><strong className="text-foreground">Envoi du colis :</strong> Retournez les produits dans leur emballage d'origine. Les frais de retour sont à notre charge en cas de défaut ou erreur de notre part.</li>
              <li><strong className="text-foreground">Traitement :</strong> Après vérification, nous procédons au remplacement ou au remboursement sous 14 jours.</li>
            </ol>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Modalités de remboursement</h2>
            <div className="grid gap-3 sm:grid-cols-3 mt-2">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-lg">💰</p>
                <p className="font-semibold text-foreground text-xs">Remboursement</p>
                <p className="text-xs mt-1">Virement bancaire sous 14 jours ouvrés après validation du retour.</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-lg">🎁</p>
                <p className="font-semibold text-foreground text-xs">Avoir</p>
                <p className="text-xs mt-1">Crédit sur votre compte pour une prochaine commande (sur demande).</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-lg">🔄</p>
                <p className="font-semibold text-foreground text-xs">Réimpression</p>
                <p className="text-xs mt-1">Nouvelle production à nos frais en cas de défaut de notre part.</p>
              </div>
            </div>
            <p className="mt-2">Les frais de livraison initiaux sont remboursés uniquement si la totalité de la commande est retournée pour défaut ou erreur de notre part.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Droit de rétractation</h2>
            <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux produits personnalisés ou fabriqués selon les spécifications du consommateur.</p>
            <p>Pour les produits non personnalisés (produits en stock sans marquage), le droit de rétractation de 14 jours s'applique. Les produits doivent être retournés dans leur état d'origine, non utilisés et dans leur emballage d'origine.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Besoin d'aide ? Contactez-nous</h2>
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <div className="rounded-lg border border-border p-3">
                <p className="font-semibold text-foreground">📧 Par email</p>
                <p><a href="mailto:contact@j2lprint.fr" className="text-primary hover:underline">contact@j2lprint.fr</a></p>
                <p className="text-xs mt-1">Joignez photos + n° de commande</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="font-semibold text-foreground">📞 Par téléphone</p>
                <p><a href="tel:+33329304479" className="text-primary hover:underline">03 29 30 44 79</a></p>
                <p className="text-xs mt-1">Du lundi au vendredi, 9h-18h</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            <strong className="text-foreground">J2L Publicité</strong> — 22 B rue Robert Barret, 88390 Uxegney, France<br />
            Les présentes informations complètent nos <Link to="/cgv" className="text-primary hover:underline">Conditions Générales de Vente (CGV)</Link>. En cas de divergence, ce sont les CGV qui prévalent. Consultez également notre page <Link to="/livraison" className="text-primary hover:underline">Livraison</Link> pour connaître nos délais et zones de livraison.
          </p>
        </div>
      </div>
    </section>
  );
}
