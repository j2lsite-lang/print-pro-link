import { useEffect } from "react";

const WorkerDiagnostic = () => {
  useEffect(() => {
    document.title = "Diagnostic Worker Cloudflare | J2L Print";
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");

    return () => {
      robots?.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">Diagnostic Worker</p>
        <h1 className="text-3xl font-bold md:text-5xl">Cloudflare ne sert pas le Worker sur cette URL.</h1>
        <div className="space-y-4 text-base leading-7 text-muted-foreground">
          <p>
            Cette page est rendue par l’application J2L Print. Si le Worker Cloudflare était actif sur
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">j2lprint.fr/*</code>,
            cette URL renverrait un JSON avec l’en-tête
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-foreground">X-Worker: j2lprint-seo/4.4.0</code>.
          </p>
          <p>
            Le code Worker est prêt dans le projet, mais la route Cloudflare du domaine public doit pointer vers ce script.
          </p>
        </div>
        <dl className="grid gap-3 border-t border-border pt-6 text-sm md:grid-cols-2">
          <div>
            <dt className="font-semibold text-foreground">URL testée</dt>
            <dd className="break-all text-muted-foreground">https://j2lprint.fr/__worker</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Résultat attendu</dt>
            <dd className="text-muted-foreground">JSON Worker + headers SEO</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Résultat actuel</dt>
            <dd className="text-muted-foreground">Application Lovable servie directement</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Action restante</dt>
            <dd className="text-muted-foreground">Attacher la route Cloudflare au Worker</dd>
          </div>
        </dl>
      </section>
    </main>
  );
};

export default WorkerDiagnostic;