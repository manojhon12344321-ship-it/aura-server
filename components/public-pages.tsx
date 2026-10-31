"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  Truck,
  Star,
  CheckCircle2,
  ShoppingBag,
  Heart,
  CreditCard,
  QrCode,
} from "lucide-react";
import { useShop } from "@/lib/store";
import { restoreShopping } from "@/lib/session";
import { money, Product, Order } from "@/lib/data";
import { demoCoupon, freeShipping } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "./product-card";
import { ProductGallery } from "./ui/product-gallery";
import { ImageCarousel } from "./ui/image-carousel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
export function Breadcrumb({ name }: { name: string }) {
  return (
    <div className="breadcrumb">
      <Link href="/">Início</Link>
      <ChevronRight size={12} />
      <span>{name}</span>
    </div>
  );
}
export function Catalog() {
  const params = useSearchParams();
  const shop = useShop();
  const categoryParam = params.get("categoria");
  const category =
    shop.categories.find(
      (c) => c.slug === categoryParam || c.id === categoryParam,
    )?.id || categoryParam;
  const offers = params.get("ofertas");
  const [sort, setSort] = useState("featured");
  let list = shop.catalog.filter(
    (p) =>
      p.is_active &&
      (!category || p.category_id === category) &&
      (!offers || p.compare_price > p.price),
  );
  if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
  return (
    <div className="container page-container">
      <Breadcrumb name="Coleção" />
      <span className="eyebrow purple">O SEU PRÓXIMO NÍVEL</span>
      <h1 className="page-title">
        {offers
          ? "Ofertas para o seu setup"
          : shop.categories.find((c) => c.id === category)?.name ||
            "Explore o extraordinário."}
      </h1>
      <p className="page-subtitle">
        Cada detalhe do seu próximo upgrade está aqui.
      </p>
      <div className="catalog-filters">
        <Link className={!category ? "active" : ""} href="/catalogo">
          Todos
        </Link>
        {shop.categories.map((c) => (
          <Link
            className={category === c.id ? "active" : ""}
            key={c.id}
            href={`/catalogo?categoria=${c.id}`}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="toolbar">
        <span className="muted small">{list.length} produtos encontrados</span>
        <select
          aria-label="Ordenar produtos"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="featured">Mais relevantes</option>
          <option value="low">Menor preço</option>
          <option value="high">Maior preço</option>
        </select>
      </div>
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <ShoppingBag />
          <h3>Nenhum produto por aqui ainda.</h3>
          <Link className="btn" href="/catalogo">
            Explorar coleção
          </Link>
        </div>
      )}
    </div>
  );
}
export function ProductPage({
  slug,
  initial,
}: {
  slug: string;
  initial?: Product;
}) {
  const shop = useShop();
  const p = shop.catalog.find((p) => p.slug === slug) || initial;
  const [qty, setQty] = useState(1);
  const [shipping, setShipping] = useState("");
  const [reviews, setReviews] = useState<
    {
      id: string;
      rating: number;
      comment: string;
      profiles?: { name: string };
    }[]
  >([]);
  const router = useRouter();
  useEffect(() => {
    if (supabase && p)
      void supabase
        .from("reviews")
        .select("*,profiles(name)")
        .eq("product_id", p.id)
        .eq("is_approved", true)
        .then(({ data }) => setReviews(data || []));
    else if (p)
      setReviews(
        JSON.parse(localStorage.getItem("divinos-reviews") || "[]").filter(
          (r: { product_id: string; is_approved: boolean }) =>
            r.product_id === p.id && r.is_approved,
        ),
      );
  }, [p?.id]);
  if (!p)
    return (
      <div className="container page-container empty">
        <h1>Produto não encontrado</h1>
        <Link className="btn" href="/catalogo">
          Explorar coleção
        </Link>
      </div>
    );
  return (
    <div className="container page-container">
      <Breadcrumb name={p.name} />
      <div className="product-detail">
        <ProductGallery images={p.images} name={p.name} />
        <div>
          <span className="eyebrow purple">
            PRODUTO ORIGINAL • GARANTIA DE 12 MESES
          </span>
          <h1>{p.name}</h1>
          <div className="rating">
            <span>★★★★★</span>
            <small>
              {reviews.length
                ? `${(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} (${reviews.length} avaliações)`
                : "Seja o primeiro a avaliar"}
            </small>
          </div>
          <p className="small muted">SKU: {p.sku} · DIVINOS GAMES</p>
          <div style={{ marginTop: 28 }}>
            <del className="muted">{money(p.compare_price)}</del>
            <div className="detail-price">{money(p.price)}</div>
            <span className="green small">à vista no Pix</span>
            <p className="page-subtitle" style={{ marginTop: 10 }}>
              ou 12x de {money(p.price / 12)} sem juros no cartão
            </p>
          </div>
          <div className="detail-stock">
            {p.stock > 0
              ? `● ${p.stock < 10 ? `Apenas ${p.stock} em estoque!` : "Em estoque. Pronto para o seu próximo nível."}`
              : "Produto esgotado"}
            <div className="stock-track">
              <span style={{ width: `${Math.min(100, p.stock * 5)}%` }} />
            </div>
          </div>
          <div className="quantity">
            <button
              aria-label="Diminuir"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              <Minus size={14} />
            </button>
            {qty}
            <button
              aria-label="Aumentar"
              onClick={() => setQty(Math.min(p.stock, qty + 1))}
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="buy-actions">
            <button
              className="btn"
              disabled={!p.stock}
              onClick={() => {
                shop.add(p.id, qty);
                router.push("/checkout");
              }}
            >
              Comprar agora <ArrowRight size={17} />
            </button>
            <button
              className="btn outline"
              disabled={!p.stock}
              onClick={() => {
                shop.add(p.id, qty);
                toast.success("Adicionado ao carrinho");
              }}
            >
              <ShoppingBag size={17} /> Adicionar
            </button>
            <button
              aria-label="Favoritar produto"
              className="icon-btn"
              onClick={() => shop.favorite(p.id)}
            >
              <Heart
                fill={shop.wishlist.includes(p.id) ? "#a378ff" : "none"}
                size={21}
              />
            </button>
          </div>
          <form
            className="shipping-form"
            onSubmit={(e) => {
              e.preventDefault();
              setShipping(
                p.price >= freeShipping()
                  ? "Frete grátis • entrega em 5 a 8 dias úteis"
                  : "R$ 24,90 • entrega em 5 a 8 dias úteis",
              );
            }}
          >
            <Truck size={23} className="purple" />
            <input
              required
              pattern="[0-9]{5}-?[0-9]{3}"
              placeholder="Digite seu CEP"
              aria-label="CEP"
            />
            <button className="btn outline">Calcular</button>
          </form>
          {shipping && (
            <p className="green small" style={{ marginTop: 12 }}>
              {shipping}
            </p>
          )}
          <p
            className="small muted"
            style={{
              marginTop: 25,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <ShieldCheck size={16} /> Compra protegida · Nota fiscal · Produto
            original
          </p>
        </div>
      </div>
      <Tabs defaultValue="description" className="detail-tabs">
        <TabsList>
          <TabsTrigger value="description">Descrição</TabsTrigger>
          <TabsTrigger value="specs">Especificações</TabsTrigger>
          <TabsTrigger value="reviews">
            Avaliações ({reviews.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="tab-content">
          <h3 className="text-white text-xl mb-4">
            Feito para o seu próximo nível.
          </h3>
          {p.description}
        </TabsContent>
        <TabsContent value="specs" className="tab-content">
          <table className="data-table">
            <tbody>
              {[
                ["Produto", p.name],
                ["SKU", p.sku],
                ["Garantia", "12 meses"],
                ["Condição", "Novo e original"],
                ["Conteúdo", "Produto, manual e nota fiscal"],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="reviews" className="tab-content">
          {reviews.length ? (
            reviews.map((r) => (
              <div className="review" key={r.id}>
                <strong>{r.profiles?.name || "Gamer"}</strong>
                <span className="stars"> {"★".repeat(r.rating)}</span>
                <p>{r.comment}</p>
              </div>
            ))
          ) : (
            <p>Ainda sem avaliações. Conte como foi sua experiência.</p>
          )}
          <form
            className="panel"
            style={{ marginTop: 25 }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!shop.user) {
                router.push("/login");
                return;
              }
              const data = new FormData(e.currentTarget);
              if (supabase) {
                const { error } = await supabase.from("reviews").insert({
                  product_id: p.id,
                  user_id: shop.user.id,
                  rating: Number(data.get("rating")),
                  comment: data.get("comment"),
                });
                if (error) {
                  toast.error(error.message);
                  return;
                }
              } else {
                const list = JSON.parse(
                  localStorage.getItem("divinos-reviews") || "[]",
                );
                list.push({
                  id: crypto.randomUUID(),
                  product_id: p.id,
                  user_id: shop.user.id,
                  rating: Number(data.get("rating")),
                  comment: String(data.get("comment")),
                  is_approved: false,
                  profiles: { name: shop.user.name },
                  products: { name: p.name },
                });
                localStorage.setItem("divinos-reviews", JSON.stringify(list));
              }
              toast.success("Avaliação enviada para aprovação!");
            }}
          >
            <label className="field">
              Sua nota
              <select name="rating">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Sua avaliação
              <textarea
                name="comment"
                required
                minLength={10}
                placeholder="O que achou do seu upgrade?"
              />
            </label>
            <button className="btn">Enviar avaliação</button>
          </form>
        </TabsContent>
      </Tabs>
      <section className="product-section">
        <div className="section-heading">
          <h2>Complete o seu setup.</h2>
        </div>
        <ImageCarousel variant="products">
          {shop.catalog
            .filter((x) => x.id !== p.id && x.is_active)
            .slice(0, 8)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </ImageCarousel>
      </section>
    </div>
  );
}
export function Cart() {
  const shop = useShop();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    discount_type: string;
    value: number;
    min_order: number;
  } | null>(null);
  const subtotal = shop.cart.reduce(
    (s, i) =>
      s +
      (shop.catalog.find((p) => p.id === i.product_id)?.price || 0) *
        i.quantity,
    0,
  );
  const discount =
    coupon && subtotal >= coupon.min_order
      ? Math.min(
          subtotal,
          coupon.discount_type === "percent"
            ? (subtotal * coupon.value) / 100
            : coupon.value,
        )
      : 0;
  const shipping = subtotal >= freeShipping() || !subtotal ? 0 : 24.9;
  async function apply() {
    if (supabase) {
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: code.toUpperCase(),
        p_subtotal: subtotal,
      });
      if (error || !data) {
        toast.error(error?.message || "Cupom inválido");
        return;
      }
      setCoupon(data);
    } else {
      const result = demoCoupon(code, subtotal);
      if (!result) {
        toast.error("Cupom inválido, expirado ou mínimo não atingido");
        return;
      }
      setCoupon(result);
    }
    sessionStorage.setItem("divinos-coupon", code.toUpperCase());
    toast.success("Cupom aplicado!");
  }
  return (
    <div className="container page-container">
      <Breadcrumb name="Carrinho" />
      <h1 className="page-title">Seu próximo upgrade.</h1>
      <p className="page-subtitle">Cada item, um passo para o próximo nível.</p>
      {!shop.cart.length ? (
        <div className="panel empty">
          <ShoppingBag />
          <h3>Seu carrinho está esperando por uma conquista.</h3>
          <p>Encontre o que falta no seu setup.</p>
          <Link href="/catalogo" className="btn">
            Explorar produtos <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {shop.cart.map((i) => {
              const p = shop.catalog.find((x) => x.id === i.product_id);
              return (
                p && (
                  <div className="cart-item" key={p.id}>
                    <Link href={`/produto/${p.slug}`}>
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        width={95}
                        height={95}
                      />
                    </Link>
                    <div>
                      <h3>
                        <Link href={`/produto/${p.slug}`}>{p.name}</Link>
                      </h3>
                      <div className="quantity">
                        <button
                          aria-label="Diminuir quantidade"
                          onClick={() => shop.quantity(p.id, i.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        {i.quantity}
                        <button
                          aria-label="Aumentar quantidade"
                          onClick={() => shop.quantity(p.id, i.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <strong className="item-price">
                      {money(p.price * i.quantity)}
                    </strong>
                    <button
                      className="icon-btn"
                      aria-label="Remover produto"
                      onClick={() => shop.quantity(p.id, 0)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              );
            })}
            <Link className="btn outline mt-6" href="/catalogo">
              Continuar explorando
            </Link>
          </div>
          <aside className="panel self-start">
            <h3 className="text-lg">Resumo do pedido</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="summary-row">
              <span>Frete</span>
              <b className="green">{shipping ? money(shipping) : "Grátis"}</b>
            </div>
            <div className="summary-row">
              <span>Desconto</span>
              <b className="green">− {money(discount)}</b>
            </div>
            <form
              className="coupon-form"
              onSubmit={(e) => {
                e.preventDefault();
                void apply();
              }}
            >
              <input
                aria-label="Cupom de desconto"
                placeholder="Seu cupom de desconto"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button className="btn outline">Aplicar</button>
            </form>
            {coupon && (
              <p className="green small mt-3">{coupon.code} aplicado</p>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <strong>{money(subtotal + shipping - discount)}</strong>
            </div>
            <Link className="btn full" href="/checkout">
              Ir para checkout <ArrowRight size={17} />
            </Link>
            <p className="small muted text-center mt-5">
              🔒 Ambiente seguro e protegido
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
const addressSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().min(3, "Informe a rua"),
  number: z.string().min(1, "Informe o número"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "Use a UF"),
  complement: z.string().optional(),
});
export function Checkout() {
  const shop = useShop();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState("pix");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState("");
  const requestId = useRef<string | null>(null);
  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
  });
  const subtotal = shop.cart.reduce(
    (s, i) =>
      s +
      (shop.catalog.find((p) => p.id === i.product_id)?.price || 0) *
        i.quantity,
    0,
  );
  const [discount, setDiscount] = useState(0);
  const shipping = subtotal >= freeShipping() ? 0 : 24.9;
  const total = subtotal + shipping - discount;
  useEffect(() => {
    const code = sessionStorage.getItem("divinos-coupon");
    if (!code) return;
    if (supabase) {
      void supabase
        .rpc("validate_coupon", { p_code: code, p_subtotal: subtotal })
        .then(({ data }) => {
          if (data)
            setDiscount(
              Math.min(
                subtotal,
                data.discount_type === "percent"
                  ? (subtotal * data.value) / 100
                  : data.value,
              ),
            );
        });
    } else {
      const c = demoCoupon(code, subtotal);
      setDiscount(
        c
          ? Math.min(
              subtotal,
              c.discount_type === "percent"
                ? (subtotal * c.value) / 100
                : c.value,
            )
          : 0,
      );
    }
  }, [subtotal]);
  async function place() {
    if (!shop.user) {
      toast.error("Entre na sua conta para finalizar");
      router.push("/login?next=/checkout");
      return;
    }
    setBusy(true);
    try {
      const items = shop.cart.map((i) => {
        const p = shop.catalog.find((p) => p.id === i.product_id)!;
        return { ...i, name: p.name, image: p.images[0], price: p.price };
      });
      if (
        items.some(
          (i) =>
            i.quantity >
            (shop.catalog.find((p) => p.id === i.product_id)?.stock || 0),
        )
      )
        throw new Error("Estoque insuficiente. Revise seu carrinho.");
      let order: Order = {
        id: crypto.randomUUID(),
        user_id: shop.user.id,
        status: "paid",
        total,
        subtotal,
        discount,
        shipping,
        payment_method: `mock_${payment}`,
        shipping_address: form.getValues() as Record<string, string>,
        coupon_code: sessionStorage.getItem("divinos-coupon") || "",
        created_at: new Date().toISOString(),
        items,
      };
      if (supabase) {
        const { data, error } = await supabase.rpc("checkout", {
          p_items: items.map(({ product_id, quantity }) => ({
            product_id,
            quantity,
          })),
          p_address: form.getValues(),
          p_payment: `mock_${payment}`,
          p_coupon: order.coupon_code,
          p_request_id:
            requestId.current || (requestId.current = crypto.randomUUID()),
        });
        if (error) throw error;
        order = { ...order, ...data, items };
      }
      shop.addOrder(order);
      sessionStorage.removeItem("divinos-coupon");
      setCompleted(order.id);
      toast.success("Pedido demonstrativo confirmado!");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível finalizar",
      );
    } finally {
      setBusy(false);
    }
  }
  if (completed)
    return (
      <div className="container page-container empty">
        <CheckCircle2 className="green" />
        <h1 className="page-title">Seu próximo nível está a caminho!</h1>
        <p>
          Pedido #{completed.slice(0, 8)} confirmado em modo de pagamento
          demonstrativo.
        </p>
        <Link className="btn mt-6" href={`/cliente/pedidos/${completed}`}>
          Acompanhar pedido <ArrowRight size={17} />
        </Link>
      </div>
    );
  if (!shop.cart.length)
    return (
      <div className="container page-container empty">
        <ShoppingBag />
        <h1 className="page-title">Seu carrinho está vazio</h1>
        <Link href="/catalogo" className="btn">
          Encontrar meu upgrade
        </Link>
      </div>
    );
  return (
    <div className="container page-container">
      <Breadcrumb name="Checkout" />
      <h1 className="page-title">Falta pouco para o próximo nível.</h1>
      <div className="checkout-steps">
        {["Endereço", "Pagamento", "Revisão"].map((s, i) => (
          <span key={s} className={step >= i ? "active" : ""}>
            <b>{i + 1}</b>
            {s}
          </span>
        ))}
      </div>
      <div className="cart-layout">
        <div className="panel">
          {step === 0 ? (
            <form onSubmit={form.handleSubmit(() => setStep(1))}>
              <h2 className="text-xl mb-6">Onde vamos entregar?</h2>
              <div className="form-grid">
                {[
                  ["name", "Nome completo"],
                  ["cep", "CEP"],
                  ["street", "Rua / Avenida"],
                  ["number", "Número"],
                  ["complement", "Complemento"],
                  ["city", "Cidade"],
                  ["state", "Estado (UF)"],
                ].map(([key, label]) => (
                  <label className="field" key={key}>
                    {label}
                    <input
                      {...form.register(
                        key as keyof z.infer<typeof addressSchema>,
                      )}
                    />
                    {form.formState.errors[
                      key as keyof z.infer<typeof addressSchema>
                    ] && (
                      <span className="field-error">
                        {
                          form.formState.errors[
                            key as keyof z.infer<typeof addressSchema>
                          ]?.message
                        }
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <button className="btn">
                Continuar <ArrowRight size={16} />
              </button>
            </form>
          ) : step === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <h2 className="text-xl mb-5">Como prefere pagar?</h2>
              <p className="page-subtitle">
                Simulação de pagamento. Nenhum valor será cobrado. Não utilize
                dados reais de cartão.
              </p>
              <div className="payment-options">
                <button
                  type="button"
                  className={payment === "pix" ? "active" : ""}
                  onClick={() => setPayment("pix")}
                >
                  <QrCode className="mb-2" />
                  Pix<small>Aprovação instantânea</small>
                </button>
                <button
                  type="button"
                  className={payment === "card" ? "active" : ""}
                  onClick={() => setPayment("card")}
                >
                  <CreditCard className="mb-2" />
                  Cartão<small>Até 12x sem juros</small>
                </button>
              </div>
              {payment === "pix" ? (
                <div className="panel text-center">
                  <QrCode size={110} className="mx-auto purple mb-4" />
                  <p className="small muted">
                    QR ilustrativo — pagamento simulado ao confirmar
                  </p>
                </div>
              ) : (
                <div>
                  <label className="field">
                    Cartão demonstrativo
                    <input value="4242 4242 4242 4242" readOnly />
                  </label>
                  <label className="field">
                    Parcelas
                    <select>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i}>
                          {i + 1}x de {money(total / (i + 1))} sem juros
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div className="buy-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setStep(0)}
                >
                  Voltar
                </button>
                <button className="btn">
                  Revisar pedido <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="text-xl mb-5">Tudo pronto para o seu upgrade?</h2>
              <p className="page-subtitle">
                {Object.values(form.getValues()).filter(Boolean).join(" · ")}
              </p>
              <p className="purple mb-5">
                Pagamento: {payment === "pix" ? "Pix" : "Cartão"} (simulação)
              </p>
              {shop.cart.map((i) => {
                const p = shop.catalog.find((p) => p.id === i.product_id);
                return (
                  <div className="summary-row" key={i.product_id}>
                    <span>
                      {i.quantity}x {p?.name}
                    </span>
                    <b>{money((p?.price || 0) * i.quantity)}</b>
                  </div>
                );
              })}
              <div className="buy-actions">
                <button className="btn outline" onClick={() => setStep(1)}>
                  Voltar
                </button>
                <button disabled={busy} className="btn" onClick={place}>
                  {busy ? "Confirmando..." : "Confirmar pedido demonstrativo"}
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        <aside className="panel self-start">
          <h3>Seu pedido</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <b>{money(subtotal)}</b>
          </div>
          <div className="summary-row">
            <span>Frete</span>
            <b>{shipping ? money(shipping) : "Grátis"}</b>
          </div>
          <div className="summary-row">
            <span>Desconto</span>
            <b>−{money(discount)}</b>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <p className="muted small">
            🔒 Checkout seguro • Pagamento demonstrativo
          </p>
        </aside>
      </div>
    </div>
  );
}
export function Auth({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const shop = useShop();
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      if (supabase) {
        const result = register
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { name: form.get("name") },
                emailRedirectTo: `${location.origin}/auth/callback`,
              },
            })
          : await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (!result.data.session) {
          toast.success("Confira seu e-mail para confirmar o cadastro.");
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", result.data.user!.id)
          .single();
        if (error) throw error;
        shop.setUser({ ...data, email });
        await restoreShopping(data.id);
        router.push(
          data.role === "admin" ? "/admin" : safeNext(params.get("next")),
        );
      } else {
        if (register)
          localStorage.setItem("divinos-demo-name", String(form.get("name")));
        shop.setUser({
          id: "demo-user",
          email,
          name: localStorage.getItem("divinos-demo-name") || "Gamer",
          role: "client",
        });
        router.push(safeNext(params.get("next")));
      }
      toast.success(
        register ? "Bem-vindo à DIVINOS GAMES!" : "Bom ter você de volta!",
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível entrar");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page-container">
      <div className="panel auth-panel">
        <span className="eyebrow purple mb-5">DIVINOS GAMES</span>
        <h1>
          {register
            ? "Seu próximo nível começa aqui."
            : "Bom ter você de volta."}
        </h1>
        <p>
          {register
            ? "Crie sua conta e faça parte do jogo."
            : "Entre para acompanhar pedidos e salvar seus favoritos."}
        </p>
        {!supabase && (
          <p className="small purple">
            Modo demonstrativo: use um e-mail e uma senha fictícios. Os dados
            ficam neste navegador.
          </p>
        )}
        <form onSubmit={submit}>
          {register && (
            <label className="field">
              Nome completo
              <input name="name" required minLength={3} autoComplete="name" />
            </label>
          )}
          <label className="field">
            E-mail
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
            />
          </label>
          <label className="field">
            Senha
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder="Mínimo de 6 caracteres"
            />
          </label>
          <button className="btn full" disabled={busy}>
            {busy
              ? "Aguarde..."
              : register
                ? "Criar minha conta"
                : "Entrar na minha conta"}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth-divider">ou continue com</div>
        <button
          className="btn outline full"
          onClick={async () => {
            if (!supabase) {
              toast.info("Google OAuth disponível após configurar o Supabase.");
              return;
            }
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${location.origin}/auth/callback` },
            });
            if (error) toast.error(error.message);
          }}
        >
          Google
        </button>
        <p className="text-center mt-5">
          {register ? "Já faz parte do jogo?" : "Ainda não tem conta?"}{" "}
          <Link className="purple" href={register ? "/login" : "/cadastro"}>
            {register ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </div>
    </div>
  );
}
function safeNext(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}
