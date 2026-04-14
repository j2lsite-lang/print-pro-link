import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import imgLivraison from "@/assets/services/livraison-france.jpg";

export default function Livraison() {
  useSEO({
    title: "Livraison – Délais et tarifs d'expédition",
    description: "Informations sur la livraison J2L Print : délais 3-5 jours ouvrés, expédition France et Europe, suivi de colis. Livraison partout en France.",
  });

  return (
    <section className="py-12">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">Informations de livraison</h1>

        <div className="glass-card overflow-hidden mb-8">
          <img src={imgLivraison} alt="Livraison rapide J2L Print partout en France" className="w-full h-48 md:h-56 object-cover" width={1280} height={720} />
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card p-4 text-center">
              <p className="font-semibold text-foreground">Livraison France</p>
              <p className="text-xs mt-1">Métropolitaine</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="font-semibold text-foreground">Délai standard</p>
              <p className="text-xs mt-1">5 à 15 jours ouvrés</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="font-semibold text-foreground">Suivi colis</p>
              <p className="text-xs mt-1">Par email</p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Zones de livraison</h2>
            <p>J2L Publicité livre dans toute la France métropolitaine. Les livraisons en Corse, DOM-TOM et à l'étranger sont possibles sur demande avec un devis adapté.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">France métropolitaine :</strong> Livraison standard disponible</li>
              <li><strong className="text-foreground">Corse :</strong> Sur devis, délais majorés</li>
              <li><strong className="text-foreground">DOM-TOM :</strong> Sur devis uniquement</li>
              <li><strong className="text-foreground">Europe :</strong> Sur devis, selon pays de destination</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Processus de commande et validation du BAT</h2>
            <p>Avant toute mise en production, nous vous envoyons un <strong className="text-foreground">Bon À Tirer (BAT)</strong> pour validation. C'est un visuel de votre produit personnalisé que vous devez approuver.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Vous passez commande et nous transmettez vos fichiers (logo, textes)</li>
              <li>Nous créons le BAT et vous l'envoyons par email sous 24-48h</li>
              <li>Vous validez le BAT (ou demandez des modifications gratuites)</li>
              <li>Une fois validé + acompte reçu, la production démarre</li>
              <li>Livraison selon les délais indiqués ci-dessous</li>
            </ol>
            <p className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
              ⚠️ <strong className="text-foreground">Important :</strong> Les délais de livraison démarrent uniquement après validation du BAT et réception de l'acompte. Vérifiez soigneusement le BAT car toute erreur non signalée avant validation ne pourra faire l'objet d'un retour.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Délais de fabrication et livraison</h2>
            <p>Les délais de livraison varient selon le type de produit et la personnalisation demandée :</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-foreground font-semibold">Type de produit</th>
                    <th className="text-left py-2 text-foreground font-semibold">Délai indicatif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2">Objets publicitaires simples</td><td className="py-2">5 à 10 jours ouvrés</td></tr>
                  <tr><td className="py-2">Textiles avec marquage</td><td className="py-2">10 à 15 jours ouvrés</td></tr>
                  <tr><td className="py-2">Imprimerie (cartes, flyers)</td><td className="py-2">5 à 8 jours ouvrés</td></tr>
                  <tr><td className="py-2">Calendriers personnalisés</td><td className="py-2">10 à 15 jours ouvrés</td></tr>
                  <tr><td className="py-2">Commandes urgentes</td><td className="py-2">Sur devis express</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-2">Les délais sont calculés à partir de la validation du BAT et du règlement de l'acompte. Les délais peuvent varier en période de forte activité (fin d'année, rentrée scolaire).</p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Frais de livraison</h2>
            <p>Les frais de livraison sont calculés en fonction du poids, du volume et de la destination. Ils sont indiqués sur chaque devis.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">France métropolitaine :</strong> À partir de 6,90€ HT selon poids</li>
              <li><strong className="text-foreground">Franco de port :</strong> Offert à partir de 250€ HT de commande (hors exceptions)</li>
              <li><strong className="text-foreground">Enlèvement sur place :</strong> Gratuit à notre adresse à Uxegney (88)</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Transporteurs partenaires</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Colissimo / La Poste</li>
              <li>Chronopost (livraison express)</li>
              <li>GLS / DPD</li>
              <li>Transporteurs spécialisés pour les gros volumes</li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Réception et vérification</h2>
            <p>À la réception de votre colis, nous vous recommandons de :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vérifier l'état du colis avant signature</li>
              <li>En cas de dommage apparent, émettre des réserves précises sur le bon de livraison</li>
              <li>Nous informer de tout problème sous 48 heures par email à <a href="mailto:contact@j2lpublicite.fr" className="text-primary hover:underline">contact@j2lpublicite.fr</a></li>
            </ul>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Besoin d'aide ? Contactez-nous</h2>
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <div className="rounded-lg border border-border p-3">
                <p className="font-semibold text-foreground">📧 Par email</p>
                <p><a href="mailto:contact@j2lpublicite.fr" className="text-primary hover:underline">contact@j2lpublicite.fr</a></p>
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
            Les présentes informations complètent nos <Link to="/cgv" className="text-primary hover:underline">Conditions Générales de Vente (CGV)</Link>. En cas de divergence, ce sont les CGV qui prévalent. Consultez également notre page <Link to="/politique-retours" className="text-primary hover:underline">Retours et remboursements</Link> pour connaître nos conditions de réclamation.
          </p>
        </div>
      </div>
    </section>
  );
}
