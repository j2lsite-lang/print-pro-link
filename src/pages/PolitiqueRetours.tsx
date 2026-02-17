export default function PolitiqueRetours() {
  return (
    <section className="py-12">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Politique de retours</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Produits personnalisés</h2>
            <p>Les produits imprimés étant fabriqués sur mesure selon vos fichiers et spécifications, ils ne peuvent faire l'objet d'un retour ou d'un échange conformément à l'article L221-28 du Code de la consommation.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Produits défectueux</h2>
            <p>Si vous constatez un défaut de fabrication (erreur d'impression, qualité non conforme, produit endommagé), contactez-nous dans les <strong className="text-foreground">7 jours</strong> suivant la réception :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Par email : contact@j2l-print.fr</li>
              <li>Par téléphone : 03 29 30 44 79</li>
            </ul>
            <p>Joignez des photos du produit défectueux. Après vérification, nous procéderons à une réimpression ou un remboursement.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Colis endommagé à la livraison</h2>
            <p>En cas de colis visiblement endommagé, émettez des réserves auprès du transporteur lors de la réception et contactez-nous immédiatement.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Remboursement</h2>
            <p>En cas de remboursement accepté, celui-ci sera effectué dans un délai de 14 jours via le même moyen de paiement utilisé lors de la commande.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
