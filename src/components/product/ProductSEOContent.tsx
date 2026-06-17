import { Link } from "react-router-dom";
import { CheckCircle, Truck, FileText, Phone, ArrowRight, HelpCircle, Sparkles, Target, Briefcase, Layers, FileCheck2, Boxes } from "lucide-react";
import { getProductSEOData } from "@/lib/product-seo";
import relatedProductsMap from "@/seo/generated/related-products.json";

interface ProductSEOContentProps {
  productName: string;
  sku?: string;
  description?: string;
  options?: { title: string; values: string[] }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  "impression-papier": "Impression papier",
  "publicite-exterieure": "Publicité extérieure",
  "publicite-interieure": "Publicité intérieure",
  "etiquettes-stickers": "Étiquettes & stickers",
  "emballages-sacs": "Emballages & sacs",
  "objets-publicitaires-cadeaux": "Objets publicitaires & cadeaux",
  "textiles-accessoires": "Textiles & accessoires",
  "panneaux-baches-vinyles-toiles": "Panneaux, bâches & vinyles",
};

export default function ProductSEOContent({ productName, sku, description, options }: ProductSEOContentProps) {
  const seo = getProductSEOData(productName, sku);
  const supportsLine = [
    ...(seo.materials || []),
    ...(seo.formats || []),
    ...(seo.finitions || []),
  ];

  // Keep only real, displayable options: a clean title and at least one valid value.
  // Drop empty/undefined/duplicate values and technical-only entries.
  const cleanOptions = (options || [])
    .map((opt) => {
      const title = (opt.title || "").trim();
      const values = Array.from(
        new Set(
          (opt.values || [])
            .map((v) => (v == null ? "" : String(v).trim()))
            .filter((v) => v && v.toLowerCase() !== "undefined" && v.toLowerCase() !== "null"),
        ),
      );
      return { title, values };
    })
    .filter((opt) => opt.title && opt.values.length > 0);

  return (
    <div className="mt-12 space-y-10 border-t border-border pt-10">

      {/* Section 1 — Pourquoi choisir ce produit */}
      {seo.whyChoose && seo.whyChoose.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Pourquoi choisir votre {productName.toLowerCase()} ?
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {seo.whyChoose.map((b) => (
              <div key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2 — Usages & secteurs */}
      {((seo.usagesList && seo.usagesList.length > 0) || (seo.sectors && seo.sectors.length > 0)) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {seo.usagesList && seo.usagesList.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Pour quels usages ?
              </h2>
              <ul className="space-y-1.5">
                {seo.usagesList.map((u) => (
                  <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />{u}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {seo.sectors && seo.sectors.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Pour quels professionnels ?
              </h2>
              <div className="flex flex-wrap gap-2">
                {seo.sectors.map((s) => (
                  <span key={s} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground capitalize">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formats, supports & finitions */}
      {supportsLine.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Formats, supports et finitions disponibles
          </h2>
          <div className="flex flex-wrap gap-2">
            {supportsLine.map((v) => (
              <span key={v} className="rounded-full bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">{v}</span>
            ))}
          </div>
        </div>
      )}


      {/* Section 3 — Options de personnalisation (hidden entirely if none are real) */}
      {cleanOptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Options de personnalisation disponibles
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Configurez votre <strong>{productName.toLowerCase()}</strong> selon vos besoins.
            Chaque commande est produite sur mesure avec les options que vous sélectionnez :
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {cleanOptions.slice(0, 10).map((opt) => (
              <div key={opt.title} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{opt.title}</strong> : {opt.values.slice(0, 5).join(", ")}
                  {opt.values.length > 5 ? "…" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4 — Qualité */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Qualité d'impression et finitions
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {seo.quality}
        </p>
      </div>

      {/* Section 5 — Avantages */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5 text-center">
          <Truck className="h-7 w-7 text-primary mx-auto mb-2" />
          <h3 className="font-display text-sm font-semibold text-foreground">Livraison rapide</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Expédition en 3 à 5 jours ouvrés partout en France métropolitaine
          </p>
        </div>
        <div className="glass-card p-5 text-center">
          <FileText className="h-7 w-7 text-primary mx-auto mb-2" />
          <h3 className="font-display text-sm font-semibold text-foreground">Vérification fichiers</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Contrôle qualité automatique de vos fichiers PDF avant chaque impression
          </p>
        </div>
        <div className="glass-card p-5 text-center">
          <Phone className="h-7 w-7 text-primary mx-auto mb-2" />
          <h3 className="font-display text-sm font-semibold text-foreground">Devis gratuit sous 24h</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Contactez notre équipe par téléphone ou email pour un accompagnement personnalisé
          </p>
        </div>
      </div>

      {/* Section 6 — FAQ */}
      {seo.faq.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Questions fréquentes sur {productName.toLowerCase()}
          </h3>
          <div className="space-y-4">
            {seo.faq.map((item, i) => (
              <div key={i} className="glass-card p-5">
                <h4 className="font-display text-sm font-semibold text-foreground mb-2">{item.q}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Besoin d'un devis pour votre {productName.toLowerCase()} ?
          </h3>
          <p className="text-sm text-muted-foreground">
            Contactez-nous pour un devis personnalisé et gratuit, réponse garantie sous 24h.
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
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Découvrez aussi</h3>
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
    </div>
  );
}
