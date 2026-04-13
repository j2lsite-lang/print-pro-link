import { useState } from "react";
import { ChevronDown, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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

  // Check if this is a boolean toggle (Yes/No or Oui/Non with exactly 2 options)
  const isBooleanToggle =
    validOptions.length === 2 &&
    validOptions.some((o) => {
      const name = (o.name || String(o.slug)).toLowerCase();
      return name === "non" || name === "no" || name === "sans";
    }) &&
    validOptions.some((o) => {
      const name = (o.name || String(o.slug)).toLowerCase();
      return name === "oui" || name === "yes" || name === "avec";
    });

  // Boolean toggle – rendered as a switch
  if (isBooleanToggle) {
    const yesOption = validOptions.find((o) => {
      const name = (o.name || String(o.slug)).toLowerCase();
      return name === "oui" || name === "yes" || name === "avec";
    });
    const noOption = validOptions.find((o) => {
      const name = (o.name || String(o.slug)).toLowerCase();
      return name === "non" || name === "no" || name === "sans";
    });
    const isChecked = selectedValue === String(yesOption?.slug);

    return (
      <div className="flex items-center gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Switch
          checked={isChecked}
          onCheckedChange={(checked) => {
            const val = checked ? String(yesOption?.slug) : String(noOption?.slug);
            onSelect(val);
          }}
          disabled={locked}
        />
        <span className="text-sm text-foreground">{title}</span>
      </div>
    );
  }

  // Float input (quantity, dimensions)
  if (isFloatInput) {
    return (
      <div className="space-y-2">
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
          className="max-w-full"
          placeholder={title}
        />
      </div>
    );
  }

  // Radio buttons for small option sets (2-4 options)
  if (validOptions.length <= 4) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
          {title}
          {required && <span className="text-destructive">*</span>}
        </label>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {validOptions.map((opt) => {
            const val = String(opt.slug);
            const isSelected = selectedValue === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => !locked && onSelect(val)}
                disabled={locked}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "border-primary"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <span
                  className={cn(
                    isSelected
                      ? "text-primary font-medium"
                      : "text-foreground"
                  )}
                >
                  {opt.name || val}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Dropdown for larger option sets (5+)
  const selectedLabel =
    validOptions.find((o) => String(o.slug) === selectedValue)?.name ||
    selectedValue;

  return (
    <div className="space-y-2 relative">
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
          open
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/40",
          locked && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "truncate",
            selectedValue
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          )}
        >
          {selectedValue
            ? selectedLabel
            : `Choisir ${title.toLowerCase()}`}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {validOptions.map((opt) => {
              const val = String(opt.slug);
              const isSelected = selectedValue === val;
              return (
                <button
                  key={val}
                  onClick={() => {
                    onSelect(val);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span>{opt.name || val}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
