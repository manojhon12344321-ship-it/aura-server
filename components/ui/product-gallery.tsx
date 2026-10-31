"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Maximize, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { ImageCarousel } from "./image-carousel";
export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const move = (n: number) =>
    setIndex((i) => (i + n + images.length) % images.length);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [images.length]);
  let touch = 0;
  return (
    <div>
      <div
        className="product-main-image"
        onTouchStart={(e) => {
          touch = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (Math.abs(touch - e.changedTouches[0].clientX) > 40)
            move(touch > e.changedTouches[0].clientX ? 1 : -1);
        }}
      >
        <Image
          key={index}
          src={images[index]}
          alt={name}
          fill
          sizes="(max-width: 700px) 100vw, 50vw"
          className="fade-in"
        />
        {images.length > 1 && (
          <>
            <span className="image-count">
              {index + 1}/{images.length}
            </span>
            <button
              className="gallery-prev icon-btn"
              aria-label="Imagem anterior"
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </button>
            <button
              className="gallery-next icon-btn"
              aria-label="Próxima imagem"
              onClick={() => move(1)}
            >
              <ChevronRight />
            </button>
          </>
        )}
        <button
          className="fullscreen icon-btn"
          aria-label="Ampliar imagem"
          onClick={() => setOpen(true)}
        >
          <Maximize size={19} />
        </button>
      </div>
      {images.length > 1 && (
        <div className="thumbnails">
          {images.map((src, i) => (
            <button
              className={index === i ? "active" : ""}
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ver imagem ${i + 1}`}
            >
              <Image src={src} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>{name}</DialogTitle>
          <ImageCarousel images={images} variant="gallery" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
