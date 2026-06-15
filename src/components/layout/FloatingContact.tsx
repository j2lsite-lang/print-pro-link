import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";

export default function FloatingContact() {
  // Mount the widgets after the main content is interactive (idle / first
  // interaction) so they never compete with the initial render — purely a
  // load-timing change, the markup and behaviour are unchanged.
  const [show, setShow] = useState(false);

  useEffect(() => {
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setShow(true);
    };

    const events: (keyof WindowEventMap)[] = ["scroll", "pointerdown", "keydown", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reveal, { once: true, passive: true }));

    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const timer = idle ? idle(reveal) : window.setTimeout(reveal, 1500);

    return () => {
      events.forEach((e) => window.removeEventListener(e, reveal));
      const cancelIdle = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idle && cancelIdle) cancelIdle(timer as number);
      else window.clearTimeout(timer as number);
    };
  }, []);

  if (!show) return null;

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
