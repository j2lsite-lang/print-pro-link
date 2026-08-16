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
// Supabase is loaded on demand (only when a form is actually submitted) so its
// client never weighs on the homepage's initial JavaScript / Total Blocking Time.
import { useToast } from "@/hooks/use-toast";
import imgImpression from "@/assets/services/impression-numerique.jpg";
import imgGrandFormat from "@/assets/services/grand-format.jpg";
import imgSupports from "@/assets/services/supports-publicitaires.jpg";
import imgPerso from "@/assets/services/personnalisation.jpg";
import imgLivraison from "@/assets/services/livraison-express.jpg";
import imgPdf from "@/assets/services/verification-pdf.jpg";
import { VisualCategoryCard } from "@/components/catalog/VisualCategoryCard";
import { categoryVisuals, catalogVisuals, cdnImage } from "@/seo/data/catalog-visuals";

/* ─── Univers catalogue (visuels produits réels) ─── */
const homeUniverses = [
  { slug: "impression-papier", title: "Impression papier", desc: "Cartes de visite, flyers, dépliants, brochures." },
  { slug: "panneaux-baches-vinyles-toiles", title: "Panneaux & bâches", desc: "Dibond, PVC, bâches et toiles grand format." },
  { slug: "publicite-exterieure", title: "Publicité extérieure", desc: "Beach flags, banderoles, panneaux de chantier." },
  { slug: "publicite-interieure", title: "PLV & intérieur", desc: "Roll-ups, totems, comptoirs et présentoirs." },
  { slug: "etiquettes-stickers", title: "Étiquettes & stickers", desc: "Autocollants et étiquettes en rouleau." },
  { slug: "textiles-accessoires", title: "Textiles personnalisés", desc: "T-shirts, polos, sweats marqués à votre logo." },
  { slug: "objets-publicitaires-cadeaux", title: "Objets publicitaires", desc: "Mugs, stylos, clés USB, goodies d'entreprise." },
  { slug: "emballages-sacs", title: "Emballages & sacs", desc: "Boîtes, sacs et packagings personnalisés." },
];

/* ─── Data ─── */

const services = [
  { icon: FileText, title: "Impression professionnelle", desc: "Cartes de visite, flyers, dépliants, affiches, brochures et supports imprimés pour entreprises, commerces, associations et collectivités. Impression soignée, finitions de qualité et accompagnement personnalisé de la demande jusqu'à la livraison.", cta: "Voir les produits", img: imgImpression, link: "/impression-numerique" },
  { icon: Image, title: "Grand format & signalétique", desc: "Bâches, panneaux, adhésifs, roll-ups, kakémonos, affiches grand format et signalétique intérieure ou extérieure. Des supports visibles, résistants et adaptés à vos opérations commerciales, événements et points de vente.", cta: "Découvrir les supports", img: imgGrandFormat, link: "/grand-format" },
  { icon: Layers, title: "PLV & supports de communication", desc: "Présentoirs, comptoirs d'accueil, stands, totems, roll-ups et supports pour salons, boutiques, événements et campagnes locales. Des solutions prêtes à valoriser votre marque sur le terrain.", cta: "Voir la PLV", img: imgSupports, link: "/supports-publicitaires" },
  { icon: Printer, title: "Objets & textiles personnalisés", desc: "Textiles marqués, goodies, stylos, mugs, clés USB, sacs, accessoires et objets publicitaires personnalisés avec votre logo. Idéal pour communiquer, fidéliser vos clients et équiper vos équipes.", cta: "Personnaliser un produit", img: imgPerso, link: "/personnalisation" },
  { icon: Truck, title: "Livraison partout en France", desc: "Expédition suivie partout en France, selon le délai indiqué pour chaque produit, avec options express. Un interlocuteur dédié vous accompagne du devis à la réception de vos supports.", cta: "En savoir plus", img: imgLivraison, link: "/livraison" },
  { icon: CheckCircle, title: "Vérification des fichiers", desc: "Contrôle attentif de chaque fichier avant impression : résolution, fonds perdus, colorimétrie CMJN. La garantie d'un rendu fidèle, sans mauvaise surprise.", cta: "En savoir plus", img: imgPdf, link: "/blog" },
];


const faqItems = [
  { q: "Quels formats de fichiers acceptez-vous ?", a: "Nous acceptons les fichiers PDF, AI, PSD, EPS et images haute résolution (300 dpi min.)." },
  { q: "Quels sont les délais de livraison ?", a: "Le délai est affiché produit par produit lors de la configuration, avec des options express selon le support." },
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
  // Verrous d'envoi en cours (anti double soumission / double e-mail).
  const devisSendingRef = useRef(false);
  const callbackSendingRef = useRef(false);

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
    // Garde anti double-envoi : un second submit (double-clic, Entrée répétée)
    // pendant qu'une requête est en cours est ignoré.
    if (devisSendingRef.current) return;
    devisSendingRef.current = true;
    setDevisLoading(true);
    const form = devisFormRef.current!;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || null;
    const product = (formData.get("product") as string) || null;
    const message = (formData.get("message") as string) || null;
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("devis_requests").insert({
      name,
      email,
      phone,
      product,
      message,
    });
    if (!error) {
      try {
        await supabase.functions.invoke("send-quote-smtp", {
          body: {
            type: "devis",
            name,
            firstName: name ? name.split(" ")[0] : "",
            email,
            phone,
            product,
            message,
            pageUrl: window.location.href,
          },
        });
      } catch (mailErr) {
        console.error("Notification devis non envoyée:", mailErr);
      }
    }
    devisSendingRef.current = false;
    setDevisLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande. Veuillez réessayer.", variant: "destructive" });
    } else {
      toast({ title: "Demande envoyée ✓", description: "Nous vous répondons sous 24h." });
      form.reset();
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (callbackSendingRef.current) return;
    callbackSendingRef.current = true;
    setCallbackLoading(true);
    const form = callbackFormRef.current!;
    const formData = new FormData(form);
    const name = formData.get("cb_name") as string;
    const phone = formData.get("cb_phone") as string;
    const timeSlot = (formData.get("cb_slot") as string) || null;
    const subject = (formData.get("cb_subject") as string) || null;
    const message = (formData.get("cb_message") as string) || null;
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("callback_requests").insert({
      name,
      phone,
      time_slot: timeSlot,
      subject,
      message,
    });
    if (!error) {
      try {
        await supabase.functions.invoke("send-quote-smtp", {
          body: {
            type: "callback",
            name,
            firstName: name ? name.split(" ")[0] : "",
            phone,
            timeSlot,
            subject,
            product: subject,
            message,
            pageUrl: window.location.href,
          },
        });
      } catch (mailErr) {
        console.error("Notification rappel non envoyée:", mailErr);
      }
    }
    callbackSendingRef.current = false;
    setCallbackLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande. Veuillez réessayer.", variant: "destructive" });
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

              {/* Visuels produits réels — version mobile / tablette */}
              <div className="mt-8 grid w-full grid-cols-3 gap-3 lg:hidden">
                {["brochures-catalogues", "cartes-de-visite", "affiches-posters"].map((key, i) => (
                  <figure key={key} className="overflow-hidden rounded-2xl border border-border shadow-lg">
                    <img
                      src={cdnImage(catalogVisuals[key].url, 300, 300)}
                      alt={catalogVisuals[key].alt}
                      width={300}
                      height={300}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="aspect-square h-full w-full object-cover"
                    />
                  </figure>
                ))}
              </div>
            </div>


            {/* Right visual — composition de vrais produits imprimés du catalogue */}
            <div className="relative hidden h-[480px] lg:col-span-5 lg:block">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3">
                <figure className="relative col-span-2 row-span-2 overflow-hidden rounded-2xl border border-border shadow-2xl">
                  <img
                    src={cdnImage(catalogVisuals["brochures-catalogues"].url, 720, 720)}
                    srcSet={`${cdnImage(catalogVisuals["brochures-catalogues"].url, 720, 720)} 1x, ${cdnImage(catalogVisuals["brochures-catalogues"].url, 1080, 1080)} 2x`}
                    alt={catalogVisuals["brochures-catalogues"].alt}
                    width={720}
                    height={720}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  <figcaption className="absolute bottom-3 left-4 text-sm font-semibold text-foreground">
                    Brochures & catalogues
                  </figcaption>
                </figure>

                <figure className="relative overflow-hidden rounded-2xl border border-border shadow-xl">
                  <img
                    src={cdnImage(catalogVisuals["cartes-de-visite"].url, 400, 400)}
                    alt={catalogVisuals["cartes-de-visite"].alt}
                    width={400}
                    height={400}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </figure>

                <figure className="relative overflow-hidden rounded-2xl border border-border shadow-xl">
                  <img
                    src={cdnImage(catalogVisuals["affiches-posters"].url, 400, 400)}
                    alt={catalogVisuals["affiches-posters"].alt}
                    width={400}
                    height={400}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </figure>

                <figure className="relative col-span-3 overflow-hidden rounded-2xl border border-border shadow-xl">
                  <img
                    src={cdnImage(catalogVisuals["flyers-depliants"].url, 900, 340)}
                    alt={catalogVisuals["flyers-depliants"].alt}
                    width={900}
                    height={340}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-background/70 to-transparent" />
                  <figcaption className="absolute bottom-3 right-4 text-sm font-semibold text-foreground">
                    Flyers & dépliants
                  </figcaption>
                </figure>
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

      {/* ─── ACCROCHE ─── */}
      <section className="py-10">
        <div className="container">
          <div className="glass-card px-6 py-10 text-center md:px-12 md:py-14">
            <h2 className="mx-auto max-w-3xl font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              Votre imprimerie en ligne pour tous vos supports professionnels
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[0.975rem] leading-relaxed text-muted-foreground">
              J2L Print accompagne les entreprises, commerces, associations et collectivités dans la
              création de supports imprimés, signalétiques et publicitaires. Demandez un devis
              personnalisé selon vos quantités, formats, finitions et délais.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="rounded-2xl bg-primary px-7 py-6 text-base font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:brightness-95"
              >
                <Link to="/#devis">
                  Demander un devis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-2xl border-border px-7 py-6 text-base font-semibold"
              >
                <Link to="/products">Voir le catalogue</Link>
              </Button>
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
                    {s.cta} <ArrowRight className="h-3 w-3" />
                  </span>

                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── UNIVERS PRODUITS (visuels catalogue réels) ─── */}
      <section id="univers" className="py-8">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">
            Nos univers produits
          </h2>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Plus de 900 produits imprimés et personnalisables, configurables en ligne.
          </p>
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
            {homeUniverses.map((u) => {
              const visual = categoryVisuals[u.slug];
              return (
                <VisualCategoryCard
                  key={u.slug}
                  to={`/categorie/${u.slug}`}
                  title={u.title}
                  description={u.desc}
                  image={visual.url}
                  imageAlt={`${u.title} — ${visual.alt}`}
                />
              );
            })}
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
              <a href="mailto:contact@j2lprint.fr" className="pill font-semibold">
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
