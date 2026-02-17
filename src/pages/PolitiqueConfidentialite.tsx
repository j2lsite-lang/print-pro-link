export default function PolitiqueConfidentialite() {
  return (
    <section className="py-12">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Politique de confidentialité</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Responsable du traitement</h2>
            <p>LEMAIRE JEAN LUC — J2L Publicité, 22 B rue Robert Barret, 88390 Uxegney, France.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Données collectées</h2>
            <p>Nous collectons uniquement les données nécessaires au traitement de vos commandes et demandes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom, prénom</li>
              <li>Adresse email et téléphone</li>
              <li>Adresse postale de livraison</li>
              <li>Fichiers d'impression transmis</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Le traitement et le suivi de vos commandes</li>
              <li>La réponse à vos demandes de devis et de contact</li>
              <li>L'amélioration de nos services</li>
            </ul>
            <p>Vos données ne sont jamais vendues ni transmises à des tiers à des fins commerciales.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Durée de conservation</h2>
            <p>Les données sont conservées pendant la durée nécessaire au traitement de votre commande et conformément aux obligations légales (durée de conservation comptable).</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Vos droits</h2>
            <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous à contact@j2l-print.fr.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Cookies</h2>
            <p>Ce site utilise uniquement des cookies techniques nécessaires à son fonctionnement. Aucun cookie publicitaire ou de suivi n'est utilisé.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
