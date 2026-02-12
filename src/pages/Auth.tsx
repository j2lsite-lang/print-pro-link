import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté !");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Vérifiez votre email pour confirmer votre compte.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-elevated">
        <h1 className="font-display text-2xl font-bold text-card-foreground">
          {isLogin ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLogin ? "Accédez à votre espace client J2L Publicité." : "Rejoignez J2L Publicité pour commander."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <Input placeholder="Nom complet" value={fullName} onChange={e => setFullName(e.target.value)} required />
          )}
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Se connecter" : "Créer le compte"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
