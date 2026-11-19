import { useLocation } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();

  useSEO({ title: "Page introuvable (404)", description: "Cette page n'existe pas ou n'est plus disponible.", canonical: `https://j2lprint.fr${location.pathname}`, noindex: true });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page introuvable</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
