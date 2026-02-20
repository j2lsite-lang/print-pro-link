import { FileText } from "lucide-react";

const posts = [
  {
    title: "Comment bien préparer vos fichiers pour l'impression",
    excerpt: "Découvrez les bonnes pratiques pour des fichiers prêts à imprimer : résolution, fonds perdus, colorimétrie CMJN…",
    date: "2025-12-15",
    tag: "Conseils",
  },
  {
    title: "Quelle finition choisir pour vos cartes de visite ?",
    excerpt: "Mat, brillant, soft-touch, dorure à chaud… Tour d'horizon des finitions disponibles et de leur impact.",
    date: "2025-11-20",
    tag: "Produits",
  },
  {
    title: "Signalétique extérieure : les matériaux qui résistent",
    excerpt: "Dibond, PVC, bâche micro-perforée : quel support choisir selon l'usage et la durée d'exposition ?",
    date: "2025-10-05",
    tag: "Grand format",
  },
  {
    title: "PLV et salon professionnel : maximisez votre visibilité",
    excerpt: "Roll-ups, comptoirs, totems… Les indispensables pour un stand attractif et professionnel.",
    date: "2025-09-12",
    tag: "Événementiel",
  },
];

export default function Blog() {
  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Blog</h1>
        <p className="text-muted-foreground mb-10">Actualités, conseils et tendances de l'impression professionnelle.</p>

        <div className="space-y-5">
          {posts.map((post) => (
            <article key={post.title} className="glass-card p-6 group hover:shadow-elevated transition-all">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-1">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="tag text-xs">{post.tag}</span>
                    <span className="text-xs text-muted-foreground">{new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-foreground">{post.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
