"use client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
export function ImageCarousel({
  images,
  variant,
  children,
}: {
  images?: string[];
  variant: "hero" | "products" | "gallery";
  children?: React.ReactNode[];
}) {
  const [ref, api] = useEmblaCarousel(
    { loop: variant === "hero", align: "start", slidesToScroll: 1 },
    variant === "hero"
      ? [
          Autoplay({
            delay: 4000,
            stopOnMouseEnter: true,
            stopOnInteraction: false,
          }),
        ]
      : [],
  );
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setIndex(api.selectedScrollSnap());
    api.on("select", update);
    return () => {
      api.off("select", update);
    };
  }, [api]);
  const slides =
    children ||
    images?.map((src, i) => (
      <Image
        key={src + i}
        src={src}
        alt={`DIVINOS GAMES — imagem ${i + 1}`}
        fill
        sizes="100vw"
      />
    )) ||
    [];
  return (
    <div className={`carousel ${variant}`} aria-roledescription="carrossel">
      <div className="carousel-window" ref={ref}>
        <div className="carousel-track">
          {slides.map((slide, i) => (
            <div className="carousel-slide" key={i}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <div className="carousel-arrows">
            <button aria-label="Anterior" onClick={() => api?.scrollPrev()}>
              <ChevronLeft size={19} />
            </button>
            <button aria-label="Próximo" onClick={() => api?.scrollNext()}>
              <ChevronRight size={19} />
            </button>
          </div>
          {variant === "hero" && (
            <div className="carousel-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={i === index ? "selected" : ""}
                  aria-label={`Banner ${i + 1}`}
                  onClick={() => api?.scrollTo(i)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
