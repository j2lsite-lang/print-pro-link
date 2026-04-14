import { Link } from "react-router-dom";
import { CheckCircle, Truck, FileText, Phone, ArrowRight } from "lucide-react";

interface ProductSEOContentProps {
  productName: string;
  description?: string;
  options?: { title: string; values: string[] }[];
}

export default function ProductSEOContent({ productName, description, options }: ProductSEOContentProps) {
  return (
    <div className="mt-12 space-y-8 border-t border-border pt-10">
      {/* Description enrichie */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          {productName} – Impression professionnelle en ligne
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Commandez votre <strong>{productName.toLowerCase()}</strong> en ligne chez <strong>J2L Print</strong>.
          Notre imprimerie professionnelle vous accompagne de la commande à la livraison avec un
          <strong> contrôle qualité</strong> rigoureux sur chaque production. Que vous soyez une entreprise,
          une association ou une collectivité, bénéficiez de tarifs compétitifs et d'un service personnalisé.
        </p>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {/* Options disponibles pour SEO */}
      {options && options.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Options de personnalisation
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Configurez votre <strong>{productName.toLowerCase()}</strong> selon vos besoins grâce à nos
            nombreuses options d'impression : format, finition, support, quantité… Chaque commande
            est produite sur mesure.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.slice(0, 8).map((opt) => (
              <div key={opt.title} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>{opt.title}</strong> : {opt.values.slice(0, 4).join(", ")}{opt.values.length > 4 ? "…" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avantages */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5 text-center">
          <Truck className="h-7 w-7 text-primary mx-auto mb-2" />
          <h3 className="font-display text-sm font-semibold text-foreground">Livraison rapide</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Expédition en 3 à 5 jours ouvrés partout en France
          </p>
        </div>
        <div className="glass-card p-5 text-center">
          <FileText className="h-7 w-7 text-primary mx-auto mb-2" />
          <h3 className="font-display text-sm font-semibold text-foreground">Vérification fichiers</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Contrôle qualité automatique de vos PDF avant impression
          </p>
        </div>
        <div className="glass-card p-5 text-center">
          <Phone className="h-7 w-7 text-primary mx-auto mb-2" />
          <h3 className="font-display text-sm font-semibold text-foreground">Devis gratuit</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Réponse sous 24h par téléphone ou email
          </p>
        </div>
      </div>

      {/* CTA + liens internes */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Besoin d'un devis pour votre {productName.toLowerCase()} ?
          </h3>
          <p className="text-sm text-muted-foreground">
            Contactez-nous pour un devis personnalisé, réponse sous 24h.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/#devis" className="pill font-semibold text-sm flex items-center gap-1">
            Demander un devis <ArrowRight className="h-3 w-3" />
          </Link>
          <a href="tel:+33329304479" className="pill font-semibold text-sm flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> 03 29 30 44 79
          </a>
        </div>
      </div>

      {/* Liens internes */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Link to="/impression-numerique" className="text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowRight className="h-3 w-3 text-primary" /> Impression numérique
        </Link>
        <Link to="/grand-format" className="text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowRight className="h-3 w-3 text-primary" /> Grand format
        </Link>
        <Link to="/supports-publicitaires" className="text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowRight className="h-3 w-3 text-primary" /> Supports publicitaires
        </Link>
        <Link to="/personnalisation" className="text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowRight className="h-3 w-3 text-primary" /> Personnalisation textile
        </Link>
      </div>
    </div>
  );
}
