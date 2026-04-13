import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface OptionItem {
  slug: string | number | null;
  name?: string;
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
  optionPrices?: Record<string, number>;
  inputType?: string;
}

export default function OptionSelector({
  title,
  slug,
  options,
  selectedValue,
  onSelect,
  required,
  locked,
  inputType,
}: OptionSelectorProps) {
  const [open, setOpen] = useState(false);
  const validOptions = options.filter((o) => o.slug != null);
  const isFloatInput = inputType === "float" && validOptions.length === 0;

  if (!isFloatInput && validOptions.length === 0) return null;
  if (locked && validOptions.length === 1) return null;

  // Float input (quantity, dimensions)
  if (isFloatInput) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
          {title}
          {required && <span className="text-destructive">*</span>}
        </label>
        <Input
          type="number"
          min="1"
          step="1"
          value={selectedValue}
          onChange={(e) => onSelect(e.target.value)}
          disabled={locked}
          className="max-w-[200px]"
          placeholder={title}
        />
      </div>
    );
  }

  const selectedLabel = validOptions.find((o) => String(o.slug) === selectedValue)?.name || selectedValue;

  // Custom dropdown (like Realisaprint)
  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
        {title}
        {required && <span className="text-destructive">*</span>}
      </label>

      <button
        type="button"
        onClick={() => !locked && setOpen(!open)}
        disabled={locked}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border-2 px-4 py-3 text-sm text-left transition-colors",
          open ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
          locked && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn(
          "truncate",
          selectedValue ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {selectedValue ? selectedLabel : `Choisir ${title.toLowerCase()}`}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {validOptions.map((opt) => {
              const val = String(opt.slug);
              const isSelected = selectedValue === val;
              return (
                <button
                  key={val}
                  onClick={() => { onSelect(val); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span>{opt.name || val}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
