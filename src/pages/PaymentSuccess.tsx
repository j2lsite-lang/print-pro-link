import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="container flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-6">
        <CheckCircle className="h-12 w-12 text-primary" />
      </div>
      <h1 className="font-display text-3xl font-bold text-foreground">Paiement confirmé !</h1>
      <p className="mt-3 text-muted-foreground max-w-md">
        Merci pour votre paiement. Votre commande est en cours de traitement.
        Vous recevrez un email de confirmation avec les détails de suivi.
      </p>
      {sessionId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Réf. paiement : {sessionId.slice(0, 20)}…
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link to="/products">Continuer mes achats</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
