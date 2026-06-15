import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "loading" | "valid" | "invalid" | "already" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success || data.reason === "already_unsubscribed") setState("success");
      else setState("error");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md py-20 text-center">
      {state === "loading" && (
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
      )}

      {state === "valid" && (
        <div className="space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Se désinscrire</h1>
          <p className="text-muted-foreground">
            Confirmez pour ne plus recevoir d'e-mails de notre part.
          </p>
          <Button onClick={confirm} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer la désinscription
          </Button>
        </div>
      )}

      {state === "success" && (
        <div className="space-y-3">
          <CheckCircle className="mx-auto h-10 w-10 text-success" />
          <h1 className="font-display text-2xl font-bold text-foreground">Désinscription confirmée</h1>
          <p className="text-muted-foreground">Vous ne recevrez plus d'e-mails.</p>
        </div>
      )}

      {state === "already" && (
        <div className="space-y-3">
          <CheckCircle className="mx-auto h-10 w-10 text-success" />
          <h1 className="font-display text-2xl font-bold text-foreground">Déjà désinscrit</h1>
          <p className="text-muted-foreground">Cette adresse est déjà désinscrite.</p>
        </div>
      )}

      {(state === "invalid" || state === "error") && (
        <div className="space-y-3">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="font-display text-2xl font-bold text-foreground">Lien invalide</h1>
          <p className="text-muted-foreground">Ce lien de désinscription est invalide ou a expiré.</p>
        </div>
      )}
    </div>
  );
}
