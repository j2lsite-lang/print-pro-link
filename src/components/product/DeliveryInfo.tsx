import { Truck, Clock, FileText, Download } from "lucide-react";

interface DeliveryInfoProps {
  delai?: string;
  delaiFab?: string;
  delaiLiv?: string;
  hasFiles?: boolean;
  files?: Record<string, any>;
  template?: string;
}

export default function DeliveryInfo({
  delai,
  delaiFab,
  delaiLiv,
  hasFiles,
  files,
  template,
}: DeliveryInfoProps) {
  if (!delai && !hasFiles && !template) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      {/* Delivery time */}
      {delai && (
        <div className="flex items-start gap-3">
          <Truck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Délai : {delai}</p>
            {(delaiFab || delaiLiv) && (
              <p className="text-xs text-muted-foreground">
                {delaiFab && `Fabrication : ${delaiFab}j`}
                {delaiFab && delaiLiv && " · "}
                {delaiLiv && `Livraison : ${delaiLiv}j`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* File requirements */}
      {hasFiles && (
        <div className="flex items-start gap-3">
          <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Fichier(s) requis</p>
            {files && Object.entries(files).length > 0 && (
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {Object.entries(files).map(([key, spec]: [string, any]) => (
                  <li key={key}>
                    {spec.name || key}
                    {spec.width && spec.height && (
                      <span> — {spec.width}×{spec.height} mm</span>
                    )}
                    {spec.formats && (
                      <span> ({Array.isArray(spec.formats) ? spec.formats.join(", ") : spec.formats})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Template download */}
      {template && (
        <a
          href={template}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Download className="h-4 w-4 shrink-0" />
          Télécharger le gabarit
        </a>
      )}
    </div>
  );
}
