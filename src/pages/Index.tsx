import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Printer, FileText, Image, Layers, Truck,
  CheckCircle, ChevronDown, ChevronUp, Phone, Mail,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import imgImpression from "@/assets/services/impression-numerique.jpg";
import imgGrandFormat from "@/assets/services/grand-format.jpg";
import imgSupports from "@/assets/services/supports-publicitaires.jpg";
import imgPerso from "@/assets/services/personnalisation.jpg";
import imgLivraison from "@/assets/services/livraison-express.jpg";
import imgPdf from "@/assets/services/verification-pdf.jpg";

/* ─── Data ─── */
const services = [
  { icon: FileText, title: "Impression numérique", desc: "Cartes de visite, flyers, dépliants, affiches en petite et grande série. Qualité professionnelle offset et numérique, livrée partout en France.", img: imgImpression, link: "/impression-numerique" },
  { icon: Image, title: "Grand format", desc: "Bâches, banderoles, adhésifs, kakémonos et enseignes sur mesure. Impression haute résolution jusqu'à 1440 dpi pour une communication visuelle percutante.", img: imgGrandFormat, link: "/grand-format" },
  { icon: Layers, title: "Supports publicitaires", desc: "Roll-ups, totems, PLV, comptoirs d'accueil et signalétique intérieure/extérieure. Idéal pour salons, événements et points de vente.", img: imgSupports, link: "/supports-publicitaires" },
  { icon: Printer, title: "Personnalisation", desc: "Marquage textile (t-shirts, polos, sweats), objets publicitaires (mugs, stylos, clés USB) et goodies personnalisés pour votre entreprise.", img: imgPerso, link: "/personnalisation" },
  { icon: Truck, title: "Livraison rapide France", desc: "Expédition en 3 à 5 jours ouvrés dans toute la France : Paris, Lyon, Marseille, Lille, Strasbourg, Bordeaux, Nantes et toutes les villes.", img: imgLivraison, link: "/livraison" },
  { icon: CheckCircle, title: "Vérification PDF", desc: "Contrôle automatique de vos fichiers avant impression : résolution, fonds perdus, colorimétrie CMJN. Évitez les mauvaises surprises.", img: imgPdf, link: "/blog" },
];

const faqItems = [
  { q: "Quels formats de fichiers acceptez-vous ?", a: "Nous acceptons les fichiers PDF, AI, PSD, EPS et images haute résolution (300 dpi min.)." },
  { q: "Quels sont les délais de livraison ?", a: "En général 3 à 5 jours ouvrés. Options express disponibles." },
  { q: "Faites-vous des devis personnalisés ?", a: "Oui, remplissez le formulaire de devis ou appelez-nous directement." },
  { q: "Livrez-vous hors de France ?", a: "Oui, nous livrons dans toute l'Europe." },
];

/* ─── Component ─── */
export default function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackSent, setCallbackSent] = useState(false);

  useSEO({
    title: "J2L Print – Imprimerie en ligne | Impression & supports publicitaires",
    description: "J2L Print, votre imprimerie en ligne. Impression numérique, flyers, cartes de visite, affiches, bâches, adhésifs, objets publicitaires. Devis gratuit, nous livrons partout.",
    canonical: "https://j2lprint.fr/",
  });

  useEffect(() => {
    const handler = () => setCallbackOpen(true);
    window.addEventListener('open-callback', handler);
    return () => window.removeEventListener('open-callback', handler);
  }, []);

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackSent(true);
    setTimeout(() => {
      setCallbackOpen(false);
      setCallbackSent(false);
    }, 2500);
  };

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="py-10 md:py-16">
        <div className="container max-w-3xl">
          {/* Left card */}
          <div className="glass-card p-6 md:p-8 flex flex-col justify-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-foreground">
              <span className="text-primary">J2L Print</span> — Votre imprimerie en ligne
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
              Impression numérique, flyers, cartes de visite, affiches, bâches, adhésifs, objets publicitaires.
              Commandez en ligne, nous livrons partout. Devis gratuit sous 24h.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="tag">🖨️ Offset & numérique</span>
              <span className="tag">🚚 Livraison partout</span>
              <span className="tag">📐 Sur mesure</span>
              <span className="tag">✅ Vérif. PDF</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild className="rounded-full bg-primary text-primary-foreground font-bold hover:brightness-95">
                <Link to="/products">
                  Voir le catalogue <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="services" className="py-12">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
            Nos services
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link key={s.title} to={s.link} className="glass-card overflow-hidden group hover:shadow-elevated transition-all block">
                <div className="h-36 overflow-hidden">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    En savoir plus <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVIS ─── */}
      <section id="devis" className="py-12">
        <div className="container max-w-2xl">
          <div className="glass-card p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Demande de devis</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Décrivez votre projet, nous vous répondons sous 24h.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Merci ! Votre demande a été envoyée. (Démo)");
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nom</Label>
                  <Input placeholder="Votre nom" required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="votre@email.com" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Téléphone</Label>
                  <Input type="tel" placeholder="06 12 34 56 78" />
                </div>
                <div>
                  <Label>Produit souhaité</Label>
                  <Input placeholder="Ex : 500 flyers A5" />
                </div>
              </div>
              <div>
                <Label>Message</Label>
                <textarea
                  className="flex w-full rounded-xl border border-border bg-background/25 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/55 min-h-[100px]"
                  placeholder="Détails du projet..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-95 w-full sm:w-auto">
                Envoyer la demande
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" className="py-12">
        <div className="container max-w-2xl">
          <div className="glass-card p-6 md:p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Contactez-nous</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Par téléphone ou email, nous sommes à votre écoute.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="tel:+33329304479" className="pill font-semibold">
                <Phone className="h-4 w-4 mr-1.5" /> 03 29 30 44 79
              </a>
              <a href="mailto:contact@j2lpublicite.fr" className="pill font-semibold">
                <Mail className="h-4 w-4 mr-1.5" /> Email
              </a>
              <button onClick={() => setCallbackOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-95 transition">
                Rappelez-moi
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-12">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-foreground"
                >
                  {item.q}
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CALLBACK MODAL ─── */}
      {callbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-lg glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Rappelez-moi</h3>
                <p className="text-xs text-muted-foreground">Laissez vos infos, on vous recontacte rapidement.</p>
              </div>
              <button onClick={() => setCallbackOpen(false)} className="pill px-2 py-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {callbackSent ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-foreground font-semibold">Merci ! Nous vous rappelons bientôt.</p>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nom</Label>
                    <Input placeholder="Votre nom" required />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input type="tel" placeholder="06 12 34 56 78" required />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Créneau souhaité</Label>
                    <select className="flex w-full rounded-xl border border-border bg-background/25 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/55">
                      <option>Matin</option>
                      <option>Après-midi</option>
                      <option>Soir</option>
                    </select>
                  </div>
                  <div>
                    <Label>Sujet</Label>
                    <Input placeholder="Ex : devis bâche" />
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <textarea
                    className="flex w-full rounded-xl border border-border bg-background/25 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/55"
                    placeholder="Détails..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-95">
                    Envoyer
                  </Button>
                  <button type="button" onClick={() => setCallbackOpen(false)} className="pill font-semibold">
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
