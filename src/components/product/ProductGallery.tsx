import { useState, useEffect } from "react";
import { Package, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  fallbackImage?: string | null;
}

export default function ProductGallery({ images, productName, fallbackImage }: ProductGalleryProps) {
  const allImages = images.length > 0 ? images : fallbackImage ? [fallbackImage] : [];
  // Default to 2nd image (index 1) when available — Print.com puts the hero shot there
  const [selectedIndex, setSelectedIndex] = useState(allImages.length > 1 ? 1 : 0);
  const [zoom, setZoom] = useState(false);

  // Reset when images change
  useEffect(() => {
    setSelectedIndex(allImages.length > 1 ? 1 : 0);
  }, [allImages.length]);

  const currentImage = allImages[selectedIndex] || null;

  return (
    <>
      <div className="w-full lg:w-[460px] xl:w-[520px] shrink-0 space-y-3">
        {/* Main image */}
        {currentImage ? (
          <div
            className="aspect-square overflow-hidden rounded-2xl border border-border bg-product-surface cursor-pointer relative group shadow-sm"
            onClick={() => setZoom(true)}
          >
            <img
              src={currentImage}
              alt={productName}
              className="h-full w-full object-contain p-6"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
              <ZoomIn className="h-7 w-7 text-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-product-surface flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-colors bg-product-surface",
                  i === selectedIndex ? "border-primary" : "border-border hover:border-primary/40"
                )}
              >
                <img src={img} alt="" className="h-full w-full object-contain p-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      {zoom && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          <button
            onClick={() => setZoom(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i - 1 + allImages.length) % allImages.length); }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i + 1) % allImages.length); }}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={currentImage}
            alt={productName}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
