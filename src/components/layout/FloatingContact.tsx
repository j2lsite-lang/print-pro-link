import { useEffect, useState } from "react";
import { Phone } from "lucide-react";

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

  const btn =
    "flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="floating-contact fixed z-40 flex flex-col gap-2.5">
      <a
        href="https://m.me/343941282304726?ref=j2l-print"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nous contacter sur Messenger (J2L Print)"
        className={`${btn} bg-[#0084FF]`}
      >
        {/* Logo officiel Messenger : bulle + éclair */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 md:h-7 md:w-7" fill="currentColor">
          <path d="M12 2C6.3 2 2 6.2 2 11.8c0 3.2 1.4 6 3.7 7.8v3.8l3.4-1.9c.9.3 1.9.4 2.9.4 5.7 0 10-4.2 10-9.8S17.7 2 12 2zm1 13.1-2.6-2.8-5 2.8 5.5-5.9 2.7 2.8 4.9-2.8-5.5 5.9z" />
        </svg>
      </a>
      <a
        href="https://wa.me/33616737575"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nous contacter sur WhatsApp"
        className={`${btn} bg-[#25D366]`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 md:h-7 md:w-7" fill="currentColor">
          <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5v-.5c-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.4 1.9.8 2.6.9 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.6 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3c-.8-1.3-1.3-2.8-1.3-4.4 0-4.5 3.7-8.2 8.2-8.2s8.2 3.7 8.2 8.2-3.6 8.3-8 8.3z" />
        </svg>
      </a>

      <a
        href="tel:+33329304479"
        aria-label="Appelez-nous"
        className={`${btn} bg-primary !text-primary-foreground`}
      >
        <Phone className="h-5 w-5 md:h-6 md:w-6" />
      </a>
    </div>
  );
}
