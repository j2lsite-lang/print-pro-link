import { FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const posts = [
  {
    slug: "preparer-fichiers-impression",
    title: "Comment bien préparer vos fichiers pour l'impression",
    excerpt: "Découvrez les bonnes pratiques pour des fichiers prêts à imprimer : résolution, fonds perdus, colorimétrie CMJN…",
    content: `Pour obtenir un résultat d'impression optimal, vos fichiers doivent respecter quelques règles essentielles. Tout d'abord, travaillez en mode colorimétrique **CMJN** (Cyan, Magenta, Jaune, Noir) et non en RVB. La résolution minimale recommandée est de **300 dpi** pour les documents destinés à l'impression. N'oubliez pas d'ajouter des **fonds perdus** de 3 à 5 mm tout autour de votre document pour éviter les liserés blancs après la coupe. Enfin, vectorisez vos polices ou fournissez-les avec le fichier pour garantir un rendu fidèle. J2L Print propose un service de **vérification PDF automatique** pour contrôler vos fichiers avant lancement en production.`,
    date: "2025-12-15",
    tag: "Conseils",
    links: ["/products", "/livraison"],
  },
  {
    slug: "finition-cartes-de-visite",
    title: "Quelle finition choisir pour vos cartes de visite ?",
    excerpt: "Mat, brillant, soft-touch, dorure à chaud… Tour d'horizon des finitions disponibles et de leur impact.",
    content: `Le choix de la finition est crucial pour l'image que renvoie votre carte de visite. Le **pelliculage mat** offre un toucher velouté et une élégance sobre, tandis que le **pelliculage brillant** apporte de l'éclat et des couleurs plus vives. Le **soft-touch** crée un effet peau de pêche très premium. Pour un impact maximal, la **dorure à chaud** (or, argent, cuivre) ajoute un relief métallisé qui attire le regard. Chez J2L Print, nous proposons toutes ces finitions sur nos cartes de visite imprimées en France. Consultez notre catalogue pour découvrir toutes les options disponibles.`,
    date: "2025-11-20",
    tag: "Produits",
    links: ["/products"],
  },
  {
    slug: "signaletique-exterieure-materiaux",
    title: "Signalétique extérieure : les matériaux qui résistent",
    excerpt: "Dibond, PVC, bâche micro-perforée : quel support choisir selon l'usage et la durée d'exposition ?",
    content: `La signalétique extérieure doit résister aux intempéries, aux UV et parfois au vent. Le **Dibond** (aluminium composite) est idéal pour les enseignes permanentes grâce à sa rigidité et sa durabilité. Le **PVC expansé** est plus léger et convient aux panneaux temporaires ou aux salons. La **bâche micro-perforée** permet de couvrir de grandes surfaces vitrées tout en laissant passer la lumière. Pour les bâches de chantier ou événementielles, optez pour une bâche PVC 500g/m². J2L Print livre ces supports **partout en France** avec impression grand format haute résolution.`,
    date: "2025-10-05",
    tag: "Grand format",
    links: ["/products"],
  },
  {
    slug: "plv-salon-professionnel",
    title: "PLV et salon professionnel : maximisez votre visibilité",
    excerpt: "Roll-ups, comptoirs, totems… Les indispensables pour un stand attractif et professionnel.",
    content: `Un stand réussi repose sur une **PLV percutante**. Le **roll-up** (ou enrouleur) est le support incontournable : léger, transportable et rapide à installer. Complétez avec un **comptoir d'accueil** habillé à vos couleurs et un **totem** en carton ou en PVC pour une communication en hauteur. Les **kakémonos** et **X-banners** offrent des alternatives économiques. Pour un salon professionnel, pensez aussi aux **goodies personnalisés** (stylos, tote bags, carnets) pour marquer les esprits. Chez J2L Print, nous accompagnons les entreprises de toute la France dans la préparation de leurs événements.`,
    date: "2025-09-12",
    tag: "Événementiel",
    links: ["/products"],
  },
  {
    slug: "impression-flyers-reussie",
    title: "Réussir l'impression de vos flyers : guide complet",
    excerpt: "Format, grammage, quantité, distribution : tout ce qu'il faut savoir pour des flyers efficaces.",
    content: `Le flyer reste un outil de communication puissant quand il est bien conçu. Choisissez le bon **format** : A5 pour un tract généraliste, A6 ou DL pour une distribution en boîtes aux lettres. Le **grammage** recommandé est de 135g/m² pour un bon rapport qualité/prix, ou 250g/m² avec pelliculage pour un rendu premium. Côté **impression**, privilégiez le recto-verso pour maximiser votre message. J2L Print propose l'impression de flyers à partir de 100 exemplaires avec livraison rapide dans toute la France. Demandez un **devis gratuit** en ligne.`,
    date: "2025-08-28",
    tag: "Conseils",
    links: ["/products", "/#devis"],
  },
  {
    slug: "adhesifs-vitrine-communication",
    title: "Adhésifs et stickers : une communication visible et durable",
    excerpt: "Vitrophanie, autocollants, lettrage adhésif : transformez vos vitrines en supports publicitaires.",
    content: `Les **adhésifs** sont des supports de communication polyvalents et économiques. La **vitrophanie** (adhésif pour vitres) habille vos locaux sans travaux. Le **lettrage adhésif découpé** offre un rendu professionnel pour vos véhicules ou enseignes. Les **stickers personnalisés** sont parfaits pour le packaging ou la distribution promotionnelle. J2L Print imprime vos adhésifs sur des matériaux de qualité professionnelle avec découpe sur mesure. Nous livrons partout en France : Paris, Lyon, Marseille, Toulouse, Strasbourg, Lille, Bordeaux, Nantes et toutes les autres villes.`,
    date: "2025-07-15",
    tag: "Produits",
    links: ["/products"],
  },
];

export default function Blog() {
  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Blog – Conseils impression & communication
        </h1>
        <p className="text-muted-foreground mb-10">
          Actualités, conseils et tendances de l'impression professionnelle. 
          Retrouvez nos guides pour réussir vos projets d'impression et de communication visuelle.
        </p>

        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="glass-card p-6 group hover:shadow-elevated transition-all">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-1">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="tag text-xs">{post.tag}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-foreground">{post.title}</h2>
                  <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                  <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </div>
                  {post.links && post.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {post.links.map((link) => (
                        <Link
                          key={link}
                          to={link}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {link === "/products" ? "Voir le catalogue" : 
                           link === "/livraison" ? "Infos livraison" : 
                           link === "/#devis" ? "Demander un devis" : link}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Internal linking section */}
        <div className="mt-12 glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Découvrez nos services d'impression
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/products" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="h-3 w-3 text-primary" /> Catalogue complet de produits
            </Link>
            <Link to="/#devis" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="h-3 w-3 text-primary" /> Demande de devis gratuit
            </Link>
            <Link to="/livraison" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="h-3 w-3 text-primary" /> Informations livraison
            </Link>
            <Link to="/#services" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="h-3 w-3 text-primary" /> Nos services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}