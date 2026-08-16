import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cdnImage } from "@/seo/data/catalog-visuals";

interface VisualCategoryCardProps {
  to: string;
  title: string;
  description?: string;
  image: string;
  imageAlt: string;
  /** Rend la carte plus haute (rubriques principales) */
  size?: "default" | "large";
  eager?: boolean;
}

/**
 * Carte de rubrique illustrée par une vraie photo produit du catalogue.
 * Image 4:3, lazy-load, servie en WebP redimensionné par le CDN.
 */
export function VisualCategoryCard({
  to,
  title,
  description,
  image,
  imageAlt,
  size = "default",
  eager = false,
}: VisualCategoryCardProps) {
  const w = size === "large" ? 640 : 480;
  const h = size === "large" ? 480 : 360;

  return (
    <Link
      to={to}
      className="group glass-card overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className={`relative overflow-hidden bg-muted ${size === "large" ? "aspect-[4/3]" : "aspect-[4/3]"}`}>
        <img
          src={cdnImage(image, w, h)}
          srcSet={`${cdnImage(image, Math.round(w / 1.5), Math.round(h / 1.5))} 1x, ${cdnImage(image, w * 2, h * 2)} 2x`}
          alt={imageAlt}
          width={w}
          height={h}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
        <h3 className="absolute bottom-3 left-4 right-4 font-display text-base md:text-lg font-semibold text-foreground drop-shadow">
          {title}
        </h3>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        {description && <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{description}</p>}
        <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Découvrir <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default VisualCategoryCard;
