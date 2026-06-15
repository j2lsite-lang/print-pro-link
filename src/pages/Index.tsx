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
  const [devisLoading, setDevisLoading] = useState(false);
  const [callbackLoading, setCallbackLoading] = useState(false);
  const { toast } = useToast();
  const devisFormRef = useRef<HTMLFormElement>(null);
  const callbackFormRef = useRef<HTMLFormElement>(null);

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

  const handleDevisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevisLoading(true);
    const form = devisFormRef.current!;
    const formData = new FormData(form);
    const { error } = await supabase.from("devis_requests").insert({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      product: (formData.get("product") as string) || null,
      message: (formData.get("message") as string) || null,
    });
    setDevisLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande.", variant: "destructive" });
    } else {
      toast({ title: "Demande envoyée ✓", description: "Nous vous répondons sous 24h." });
      form.reset();
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackLoading(true);
    const form = callbackFormRef.current!;
    const formData = new FormData(form);
    const { error } = await supabase.from("callback_requests").insert({
      name: formData.get("cb_name") as string,
      phone: formData.get("cb_phone") as string,
      time_slot: (formData.get("cb_slot") as string) || null,
      subject: (formData.get("cb_subject") as string) || null,
      message: (formData.get("cb_message") as string) || null,
    });
    setCallbackLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande.", variant: "destructive" });
    } else {
      setCallbackSent(true);
      setTimeout(() => {
        setCallbackOpen(false);
        setCallbackSent(false);
      }, 2500);
    }
  };

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden py-10 md:py-14">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 -right-24 h-[500px] w-[500px] rounded-full bg-primary opacity-[0.10] blur-[160px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-[400px] w-[400px] rounded-full bg-primary opacity-[0.06] blur-[140px]" />

        <div className="container relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left content */}
            <div className="flex flex-col items-start lg:col-span-7">
              {/* Feature chips */}
              <div className="mb-8 flex flex-wrap gap-2">
                <span className="flex items-center gap-2 rounded-2xl border border-border bg-foreground/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Offset & numérique
                </span>
                <span className="rounded-2xl border border-border bg-foreground/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Livraison partout
                </span>
                <span className="rounded-2xl border border-border bg-foreground/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sur mesure
                </span>
                <span className="rounded-2xl border border-border bg-foreground/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vérif. PDF
                </span>
              </div>

              {/* Headline */}
              <h1 className="mb-6 font-display text-4xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                <span className="text-primary">J2L Print</span>
                <br />
                Votre imprimerie
                <br />
                <span className="relative inline-block">
                  en ligne
                  <span className="absolute bottom-1 left-0 h-1 w-full rounded-full bg-primary/30" />
                </span>
              </h1>

              {/* Subtext */}
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Impression numérique, flyers, cartes de visite, affiches, bâches, adhésifs, objets publicitaires.{" "}
                <span className="text-foreground/90">Commandez en ligne, nous livrons partout.</span> Devis gratuit sous 24h.
              </p>

              {/* CTA */}
              <Button
                asChild
                className="rounded-2xl bg-primary px-8 py-6 text-lg font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:brightness-95"
              >
                <Link to="/products">
                  Voir le catalogue <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Right visual */}
            <div className="relative hidden h-[480px] lg:col-span-5 lg:block">
              <div className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-gradient-to-tr from-primary/20 to-transparent shadow-2xl">
                {/* Dotted print texture */}
                <div
                  className="absolute inset-0 opacity-20 mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="absolute inset-12 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-1.5 w-1/3 rounded-full bg-primary" />
                    <div className="h-1.5 w-1/2 rounded-full bg-foreground/20" />
                  </div>
                  <div className="relative">
                    <div className="-ml-8 select-none font-display text-[140px] font-bold leading-none text-foreground/5">
                      CMYK
                    </div>
                    <div className="absolute bottom-0 right-0 p-8">
                      <div className="flex gap-2">
                        <span className="h-8 w-8 rounded-full opacity-60 mix-blend-screen" style={{ background: "#00FFFF" }} />
                        <span className="h-8 w-8 rounded-full opacity-60 mix-blend-screen" style={{ background: "#FF00FF" }} />
                        <span className="h-8 w-8 rounded-full opacity-60 mix-blend-screen" style={{ background: "#FFFF00" }} />
                        <span className="h-8 w-8 rounded-full border border-border opacity-60 mix-blend-screen" style={{ background: "#000000" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating accent card */}
              <div className="absolute -bottom-6 -left-12 max-w-[280px] rounded-2xl border border-border bg-foreground/5 p-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-foreground">Qualité Pro</span>
                </div>
                <p className="text-sm leading-snug text-muted-foreground">
                  Contrôle manuel de chaque fichier avant impression.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="services" className="py-8">
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
                  <h3 className="font-display text-[1.0625rem] font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-[0.9375rem] text-muted-foreground">{s.desc}</p>
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
              ref={devisFormRef}
              onSubmit={handleDevisSubmit}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nom</Label>
                  <Input name="name" placeholder="Votre nom" required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="votre@email.com" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Téléphone</Label>
                  <Input name="phone" type="tel" placeholder="06 12 34 56 78" />
                </div>
                <div>
                  <Label>Produit souhaité</Label>
                  <Input name="product" placeholder="Ex : 500 flyers A5" />
                </div>
              </div>
              <div>
                <Label>Message</Label>
                <textarea
                  name="message"
                  className="flex w-full rounded-xl border border-border bg-background/25 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/55 min-h-[100px]"
                  placeholder="Détails du projet..."
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={devisLoading} className="rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-95 w-full sm:w-auto">
                {devisLoading ? "Envoi…" : "Envoyer la demande"}
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
              <form ref={callbackFormRef} onSubmit={handleCallbackSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nom</Label>
                    <Input name="cb_name" placeholder="Votre nom" required />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input name="cb_phone" type="tel" placeholder="06 12 34 56 78" required />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Créneau souhaité</Label>
                    <select name="cb_slot" className="flex w-full rounded-xl border border-border bg-background/25 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/55">
                      <option>Matin</option>
                      <option>Après-midi</option>
                      <option>Soir</option>
                    </select>
                  </div>
                  <div>
                    <Label>Sujet</Label>
                    <Input name="cb_subject" placeholder="Ex : devis bâche" />
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <textarea
                    name="cb_message"
                    className="flex w-full rounded-xl border border-border bg-background/25 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/55"
                    placeholder="Détails..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={callbackLoading} className="rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-95">
                    {callbackLoading ? "Envoi…" : "Envoyer"}
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
