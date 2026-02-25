import { useState, useRef } from "react";
import { Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { humanizeSlug, translatePropertyTitle } from "@/lib/slug-translations";

interface OptionItem {
  slug: string | number | null;
  name?: string;
  nullable?: boolean;
  eco?: boolean;
  description?: string;
  type?: string;
}

interface OptionSelectorProps {
  title: string;
  slug: string;
  options: OptionItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
  required?: boolean;
  locked?: boolean;
  initialVisibleCount?: number;
  /** Price per option (keyed by slug) — shown to the right when available */
  optionPrices?: Record<string, number>;
}

export default function OptionSelector({
  title,
  slug,
  options,
  selectedValue,
  onSelect,
  required,
  locked,
  initialVisibleCount = 8,
  optionPrices,
}: OptionSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const validOptions = options.filter((o) => o.slug != null);
  const isQuantityType = slug === "copies";
  const isVisualType = ["foldingtype", "foldingmethod", "size", "format"].includes(slug);
  const showToggle = !isVisualType && validOptions.length > initialVisibleCount;
  const visibleOptions = expanded || isVisualType ? validOptions : validOptions.slice(0, initialVisibleCount);

  if (validOptions.length === 0) return null;
  if (locked && validOptions.length === 1) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      {/* Section header */}
      <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
        {translatePropertyTitle(slug, title)}
        {required && <span className="text-destructive text-xs">*</span>}
      </h3>

      {/* Horizontal scrollable visual cards (for visual types like folding, size) */}
      {isVisualType ? (
        <div className="relative group/scroll">
          {validOptions.length > 5 && (
            <>
              <button
                onClick={() => scroll("left")}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {validOptions.map((opt) => {
              const val = String(opt.slug);
              const isSelected = selectedValue === val;
              const label = opt.name || humanizeSlug(val);
              return (
                <button
                  key={val}
                  onClick={() => onSelect(val)}
                  disabled={locked}
                  className={cn(
                    "flex-shrink-0 snap-start flex flex-col items-center justify-center rounded-xl border-2 px-4 py-4 min-w-[110px] max-w-[130px] text-center transition-all duration-150",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-glow"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    locked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* Icon placeholder */}
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center mb-2 text-lg font-bold",
                    isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {isSelected ? <Check className="h-5 w-5" /> : label.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium leading-tight line-clamp-2">
                    {label}
                  </span>
                  {opt.eco && <Leaf className="h-3 w-3 text-success mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : isQuantityType ? (
        /* Quantity grid with prices */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleOptions.map((opt) => {
            const val = String(opt.slug);
            const isSelected = selectedValue === val;
            const price = optionPrices?.[val];
            return (
              <button
                key={val}
                onClick={() => onSelect(val)}
                className={cn(
                  "relative flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-card border-border text-foreground hover:border-primary/40"
                )}
              >
                <span className="font-semibold">
                  {Number(opt.slug).toLocaleString("fr-FR")}
                </span>
                {price != null && (
                  <span className={cn(
                    "text-xs",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {price.toFixed(2)} €
                  </span>
                )}
                {isSelected && !price && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Standard list options */
        <div className="space-y-1.5">
          {visibleOptions.map((opt) => {
            const val = String(opt.slug);
            const isSelected = selectedValue === val;
            return (
              <button
                key={val}
                onClick={() => onSelect(val)}
                disabled={locked}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-all duration-150 border-2 text-left",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground shadow-glow"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {opt.name || humanizeSlug(String(opt.slug))}
                  {opt.eco && <Leaf className="h-3.5 w-3.5 text-success" />}
                </span>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {showToggle && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          {expanded ? (
            <>Réduire <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Voir tout ({validOptions.length}) <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
}
