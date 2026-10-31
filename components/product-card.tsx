"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, Plus, Star, ShoppingBag } from "lucide-react";
import { Product, money } from "@/lib/data";
import { useShop } from "@/lib/store";
import { toast } from "sonner";
export function ProductCard({ product: p }: { product: Product }) {
  const shop = useShop();
  const discount =
    p.compare_price > p.price
      ? Math.round((1 - p.price / p.compare_price) * 100)
      : 0;
  const review = shop.reviewStats[p.id];
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link href={`/produto/${p.slug}`}>
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            sizes="(max-width:700px) 50vw, 25vw"
          />
          <Image
            className="second-photo"
            src={p.images[1] || p.images[0]}
            alt=""
            fill
            sizes="25vw"
          />
        </Link>
        <span className={`product-badge ${!p.stock ? "sold" : ""}`}>
          {!p.stock ? "ESGOTADO" : discount ? `-${discount}% OFF` : "ORIGINAL"}
        </span>
        <button
          aria-label={`Favoritar ${p.name}`}
          className={`favorite ${shop.wishlist.includes(p.id) ? "active" : ""}`}
          onClick={() => {
            shop.favorite(p.id);
            toast.success(
              shop.wishlist.includes(p.id)
                ? "Removido dos favoritos"
                : "Adicionado aos favoritos",
            );
          }}
        >
          <Heart
            size={17}
            fill={shop.wishlist.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="product-info">
        <span className="product-brand">
          {p.category_id === "consoles"
            ? "CONSOLES & DIVERSÃO"
            : p.category_id === "jogos"
              ? "SUA PRÓXIMA AVENTURA"
              : "PERFORMANCE & ESTILO"}
        </span>
        <Link href={`/produto/${p.slug}`} className="product-name">
          {p.name}
        </Link>
        <div className="rating">
          <span>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={11}
                fill={
                  review && n <= Math.round(review.average)
                    ? "currentColor"
                    : "none"
                }
              />
            ))}
          </span>
          <small>
            {review ? (
              <>
                {review.average.toFixed(1)} <span>({review.count})</span>
              </>
            ) : (
              "Seja o primeiro a avaliar"
            )}
          </small>
        </div>
        <del>
          {p.compare_price > p.price
            ? money(p.compare_price)
            : "Preço especial"}
        </del>
        <div className="price-row">
          <div>
            <strong>{money(p.price)}</strong>
            <small>
              no Pix <span>com desconto</span>
            </small>
          </div>
          <button
            disabled={!p.stock}
            aria-label={`Adicionar ${p.name} ao carrinho`}
            onClick={() => {
              shop.add(p.id);
              toast.success("Upgrade adicionado ao carrinho!");
            }}
          >
            <Plus size={21} />
          </button>
        </div>
        <p className="installments">
          ou 12x de <b>{money(p.price / 12)}</b> sem juros
        </p>
      </div>
    </article>
  );
}
