import { Link } from "react-router-dom";
import { ArrowRight, Printer, Truck, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Printer, title: "Impression pro", desc: "Qualité offset & numérique sur tous supports" },
  { icon: Palette, title: "Sur mesure", desc: "Configurez vos produits selon vos besoins exacts" },
  { icon: Truck, title: "Livraison rapide", desc: "Expédition optimisée dans toute l'Europe" },
  { icon: Shield, title: "Vérification PDF", desc: "Contrôle automatique de vos fichiers avant impression" },
];

export default function Index() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero px-4 py-24 md:py-32">
        <div className="container relative z-10 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
            Vos supports publicitaires, imprimés avec excellence
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/80">
            Cartes de visite, flyers, bâches, kakémonos… Configurez, commandez et recevez vos impressions en quelques clics.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/products">
                Voir le catalogue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary-foreground/5 blur-3xl" />
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">
            Pourquoi choisir J2L Publicité ?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Prêt à lancer votre projet ?</h2>
          <p className="mt-3 text-muted-foreground">Parcourez notre catalogue et configurez vos produits en ligne.</p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/products">Explorer les produits</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
