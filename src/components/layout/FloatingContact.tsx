import { MessageCircle, Phone } from "lucide-react";

export default function FloatingContact() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <a
        href="https://wa.me/33616737575"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nous contacter sur WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
      <a
        href="tel:+33329304479"
        aria-label="Appelez-nous"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
      >
        <Phone className="h-6 w-6" />
      </a>
    </div>
  );
}
