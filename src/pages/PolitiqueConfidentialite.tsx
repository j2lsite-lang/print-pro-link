import { Link } from "react-router-dom";

export default function PolitiqueConfidentialite() {
  return (
    <section className="py-12">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Politique de confidentialité</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Responsable du traitement</h2>
            <p><strong className="text-foreground">J2L Publicité</strong> — M. Jean-Luc Lemaire</p>
            <p>22 B rue Robert Barret, 88390 Uxegney, France</p>
            <p>Email : <a href="mailto:contact@j2lprint.fr" className="text-primary hover:underline">contact@j2lprint.fr</a></p>
            <p>Téléphone : <a href="tel:+33329304479" className="text-primary hover:underline">03 29 30 44 79</a></p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Données collectées</h2>
            <p>Nous collectons uniquement les données nécessaires au traitement de vos commandes et demandes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom, prénom</li>
              <li>Adresse email et numéro de téléphone</li>
              <li>Adresse postale de livraison et de facturation</li>
              <li>Nom de la société (le cas échéant)</li>
              <li>Fichiers d'impression transmis</li>
              <li>Données de connexion et de navigation (cookies techniques)</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Base légale et finalités des traitements</h2>
            <p>Vos données sont traitées sur les bases légales suivantes (article 6 du RGPD) :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Exécution du contrat :</strong> traitement et suivi de vos commandes, gestion de la relation client, facturation et livraison.</li>
              <li><strong className="text-foreground">Obligation légale :</strong> conservation des factures et documents comptables conformément au Code de commerce et au Code général des impôts.</li>
              <li><strong className="text-foreground">Intérêt légitime :</strong> amélioration de nos services, gestion des réclamations et prévention de la fraude.</li>
              <li><strong className="text-foreground">Consentement :</strong> envoi de communications commerciales (newsletters), le cas échéant.</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Destinataires des données</h2>
            <p>Vos données personnelles peuvent être communiquées aux destinataires suivants, dans la stricte limite de ce qui est nécessaire :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Sous-traitants de production :</strong> imprimeurs et fournisseurs pour la fabrication de vos commandes</li>
              <li><strong className="text-foreground">Transporteurs :</strong> pour la livraison de vos commandes (Colissimo, Chronopost, GLS, etc.)</li>
              <li><strong className="text-foreground">Hébergeur du site :</strong> Lovable (lovable.dev)</li>
              <li><strong className="text-foreground">Prestataires de paiement :</strong> pour le traitement sécurisé des transactions</li>
            </ul>
            <p>Vos données ne sont <strong className="text-foreground">jamais vendues</strong> ni transmises à des tiers à des fins commerciales ou publicitaires.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Durée de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Données clients :</strong> 3 ans à compter du dernier contact ou de la fin de la relation commerciale</li>
              <li><strong className="text-foreground">Documents comptables :</strong> 10 ans (obligation légale, art. L123-22 du Code de commerce)</li>
              <li><strong className="text-foreground">Données de prospection :</strong> 3 ans à compter du dernier contact</li>
              <li><strong className="text-foreground">Cookies :</strong> 13 mois maximum</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Transfert de données hors UE</h2>
            <p>Vos données personnelles sont hébergées au sein de l'Union européenne. Dans le cas où un transfert hors UE serait nécessaire (par exemple via un sous-traitant technique), celui-ci est encadré par des garanties appropriées (clauses contractuelles types de la Commission européenne ou décision d'adéquation).</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Vos droits</h2>
            <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Droit d'accès :</strong> obtenir la confirmation que vos données sont traitées et en obtenir une copie</li>
              <li><strong className="text-foreground">Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong className="text-foreground">Droit à l'effacement :</strong> demander la suppression de vos données (sous réserve des obligations légales)</li>
              <li><strong className="text-foreground">Droit à la limitation :</strong> obtenir la limitation du traitement dans certains cas</li>
              <li><strong className="text-foreground">Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes</li>
              <li><strong className="text-foreground">Droit à la portabilité :</strong> recevoir vos données dans un format structuré et couramment utilisé</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@j2lprint.fr" className="text-primary hover:underline">contact@j2lprint.fr</a></p>
            <p>Nous nous engageons à répondre dans un délai d'un mois à compter de la réception de votre demande.</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Réclamation auprès de la CNIL</h2>
            <p>Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous avez le droit d'introduire une réclamation auprès de la <strong className="text-foreground">Commission Nationale de l'Informatique et des Libertés (CNIL)</strong> :</p>
            <p>Site web : <a href="https://www.cnil.fr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a></p>
            <p>Adresse : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Cookies</h2>
            <p>Ce site utilise uniquement des <strong className="text-foreground">cookies techniques strictement nécessaires</strong> à son bon fonctionnement (gestion de session, authentification). Aucun cookie publicitaire, analytique ou de profilage n'est utilisé.</p>
            <p>Ces cookies étant indispensables au fonctionnement du site, ils sont exemptés du recueil de consentement (conformément à l'article 82 de la loi Informatique et Libertés).</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Sécurité des données</h2>
            <p>J2L Publicité met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre la destruction, la perte, l'altération, la divulgation ou l'accès non autorisé. Les communications sont chiffrées via le protocole HTTPS.</p>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Dernière mise à jour : février 2025 — <Link to="/mentions-legales" className="text-primary hover:underline">Mentions légales</Link>
          </p>
        </div>
      </div>
    </section>
  );
}