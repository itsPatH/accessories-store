"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  title: string;
  imageUrls: string[];
}

// Horizontal drag distance (px) that counts as a swipe on touch screens.
const SWIPE_THRESHOLD = 40;

export const ProductGallery = ({ title, imageUrls }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const hasMany = imageUrls.length > 1;

  const goTo = (index: number): void => {
    // Wraps around so the arrows never dead-end.
    setActiveIndex((index + imageUrls.length) % imageUrls.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "ArrowLeft") goTo(activeIndex - 1);
    if (event.key === "ArrowRight") goTo(activeIndex + 1);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (swipeStartX.current === null) return;
    const deltaX = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) goTo(activeIndex + (deltaX < 0 ? 1 : -1));
  };

  if (imageUrls.length === 0) {
    return (
      <div className="relative aspect-square rounded-2xl border bg-muted">
        <ImageOff className="absolute inset-0 m-auto size-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${title}`}
        tabIndex={hasMany ? 0 : undefined}
        onKeyDown={hasMany ? handleKeyDown : undefined}
        onPointerDown={hasMany ? (event) => (swipeStartX.current = event.clientX) : undefined}
        onPointerUp={hasMany ? handlePointerUp : undefined}
        className="relative aspect-square touch-pan-y overflow-hidden rounded-2xl border bg-card shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Image
          key={imageUrls[activeIndex]}
          src={imageUrls[activeIndex]}
          alt={hasMany ? `${title}, foto ${activeIndex + 1} de ${imageUrls.length}` : title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          unoptimized
          priority={activeIndex === 0}
          draggable={false}
          className="object-cover"
        />

        {hasMany && (
          <>
            <GalleryArrow direction="previous" onClick={() => goTo(activeIndex - 1)} />
            <GalleryArrow direction="next" onClick={() => goTo(activeIndex + 1)} />
            <span
              aria-live="polite"
              className="absolute right-3 bottom-3 rounded-full bg-navy/70 px-2.5 py-0.5 text-xs font-semibold text-white"
            >
              {activeIndex + 1} / {imageUrls.length}
            </span>
          </>
        )}
      </div>

      {hasMany && (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {imageUrls.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-muted transition-colors",
                  index === activeIndex ? "border-brand" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={url} alt="" fill sizes="80px" unoptimized className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const GalleryArrow = ({ direction, onClick }: { direction: "previous" | "next"; onClick: () => void }) => {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      // Keeps a tap on the arrow from also being read as the start of a swipe.
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={direction === "previous" ? "Foto anterior" : "Foto siguiente"}
      className={cn(
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition-colors hover:bg-white",
        direction === "previous" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
};
