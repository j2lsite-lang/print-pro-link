import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Leaf, Info } from "lucide-react";
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
}

export default function OptionSelector({
  title,
  slug,
  options,
  selectedValue,
  onSelect,
  required,
  locked,
  initialVisibleCount = 5,
}: OptionSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  const validOptions = options.filter((o) => o.slug != null);
  const isQuantityType = slug === "copies";
  const showToggle = validOptions.length > initialVisibleCount;
  const visibleOptions = expanded ? validOptions : validOptions.slice(0, initialVisibleCount);

  if (validOptions.length === 0) {
    return null;
  }

  if (locked && validOptions.length === 1) {
    return null; // Don't show locked single-option properties
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          {translatePropertyTitle(slug, title)}
          {required && <span className="ml-1 text-destructive text-xs">*</span>}
        </h3>
        <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>

      {isQuantityType ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleOptions.map((opt) => {
            const val = String(opt.slug);
            const isSelected = selectedValue === val;
            return (
              <button
                key={val}
                onClick={() => onSelect(val)}
                className={cn(
                  "relative flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-card border-border text-foreground hover:border-primary/40"
                )}
              >
                <span className="font-semibold">
                  {Number(opt.slug).toLocaleString("fr-FR")}
                </span>
                {isSelected && (
                  <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {visibleOptions.map((opt) => {
            const val = String(opt.slug);
            const isSelected = selectedValue === val;
            return (
              <button
                key={val}
                onClick={() => onSelect(val)}
                disabled={locked}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-all duration-150 border text-left",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-card border-border text-foreground hover:border-primary/40",
                  locked && "opacity-60 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {opt.name || humanizeSlug(String(opt.slug))}
                  {opt.eco && <Leaf className="h-3.5 w-3.5 text-success" />}
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
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
            <>
              Réduire <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Voir tout ({validOptions.length}) <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}