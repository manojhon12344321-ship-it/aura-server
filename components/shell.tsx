"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Gamepad2,
  Search,
  ShoppingBag,
  Heart,
  UserRound,
  ArrowRight,
  Menu,
  Truck,
  ShieldCheck,
  Headphones,
  ChevronDown,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { Toaster } from "sonner";
import { useShop } from "@/lib/store";
import { money } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
export function Logo() {
  const settings = useShop((s) => s.settings);
  return (
    <Link href="/" className="logo">
      <span className="logo-icon">
        {settings?.logo_url ? (
          <Image
            src={settings.logo_url}
            alt="DIVINOS GAMES"
            width={32}
            height={32}
            unoptimized
          />
        ) : (
          <Gamepad2 size={29} />
        )}
      </span>
      <span>
        DIVINOS
        <span className="logo-sub">
          GAMES<span className="logo-dot">.</span>
        </span>
      </span>
    </Link>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const shop = useShop();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState(shop.catalog);
  useEffect(() => {
    setReady(true);
    async function loadReviews() {
      const reviews = supabase
        ? (
            await supabase
              .from("reviews")
              .select("product_id,rating")
              .eq("is_approved", true)
          ).data || []
        : JSON.parse(localStorage.getItem("divinos-reviews") || "[]").filter(
            (r: { is_approved: boolean }) => r.is_approved,
          );
      const stats: Record<string, { count: number; average: number }> = {};
      for (const r of reviews) {
        const prev = stats[r.product_id] || { count: 0, average: 0 };
        stats[r.product_id] = {
          count: prev.count + 1,
          average: (prev.average * prev.count + r.rating) / (prev.count + 1),
        };
      }
      useShop.setState({ reviewStats: stats });
    }
    void loadReviews();
    if (supabase) {
      void supabase
        .from("settings")
        .select("value")
        .eq("id", "store")
        .single()
        .then(({ data }) => {
          if (data) {
            useShop.setState({ settings: data.value });
            localStorage.setItem(
              "divinos-settings",
              JSON.stringify(data.value),
            );
          }
        });
      void supabase
        .from("categories")
        .select("*")
        .then(({ data }) => {
          if (data) useShop.setState({ categories: data });
        });
      void supabase
        .from("products")
        .select("*")
        .then(({ data }) => {
          if (data) shop.setCatalog(data);
        });
      void supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) {
          shop.setUser(null);
          return;
        }
        const { data } = await supabase!
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!data) return;
        shop.setUser({ ...data, email: user.email || "", id: user.id });
        const [cart, wishlist] = await Promise.all([
          supabase!
            .from("cart_items")
            .select("product_id,quantity")
            .eq("user_id", user.id),
          supabase!
            .from("wishlist")
            .select("product_id")
            .eq("user_id", user.id),
        ]);
        if (cart.data?.length) useShop.setState({ cart: cart.data });
        if (wishlist.data)
          useShop.setState({
            wishlist: wishlist.data.map((i) => i.product_id),
          });
      });
    } // eslint-disable-next-line
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (supabase && search) {
      void supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .ilike("name", `%${search}%`)
        .limit(5)
        .then(({ data }) => setResults(data || []));
    } else
      setResults(
        shop.catalog
          .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 5),
      );
  }, [search, shop.catalog]);
  const count = ready ? shop.cart.reduce((a, i) => a + i.quantity, 0) : 0;
  return (
    <>
      <div className="announcement">
        <span>SEU PRÓXIMO NÍVEL COMEÇA AQUI</span>
        <span>
          <Truck size={13} /> Frete grátis acima de R$ 499 <b>•</b> 10% OFF na
          primeira compra: <strong>DIVINOS10</strong>
          <ArrowRight size={13} />
        </span>
        <span>100% ORIGINAL. 100% GAMER.</span>
      </div>
      <header>
        <div className="container header-main">
          <Logo />
          <div className="searchbox">
            <Search size={19} />
            <input
              aria-label="Buscar produtos"
              placeholder="O que falta no seu setup?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>⌘ K</kbd>
            {query && (
              <div className="search-results">
                {results.length ? (
                  results.map((p) => (
                    <Link
                      onClick={() => setQuery("")}
                      key={p.id}
                      href={`/produto/${p.slug}`}
                    >
                      <Image src={p.images[0]} alt="" width={45} height={45} />
                      <span>
                        {p.name}
                        <small>{money(p.price)}</small>
                      </span>
                      <ArrowRight size={16} />
                    </Link>
                  ))
                ) : (
                  <p>Nenhum produto encontrado.</p>
                )}
              </div>
            )}
          </div>
          <div className="header-actions">
            <Link
              href="/cliente/favoritos"
              className="icon-btn"
              aria-label="Favoritos"
            >
              <Heart size={21} />
            </Link>
            <Link
              href={ready && shop.user ? "/cliente" : "/login"}
              className="account"
            >
              <UserRound size={22} />
              <span>
                <small>
                  Olá,{" "}
                  {ready && shop.user ? shop.user.name.split(" ")[0] : "gamer"}
                </small>
                <b>
                  Minha conta <ChevronDown size={12} />
                </b>
              </span>
            </Link>
            <div className="header-divider" />
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="cart-button"
                  aria-label={`Carrinho, ${count} itens`}
                >
                  <ShoppingBag size={22} />
                  <span className="cart-count">{count}</span>
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle>
                  Seu carrinho <span className="purple">({count})</span>
                </SheetTitle>
                <div className="sheet-cart">
                  {shop.cart.length ? (
                    shop.cart.map((i) => {
                      const p = shop.catalog.find((p) => p.id === i.product_id);
                      return (
                        p && (
                          <div className="mini-cart" key={i.product_id}>
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              width={65}
                              height={65}
                            />
                            <div>
                              <Link href={`/produto/${p.slug}`}>{p.name}</Link>
                              <strong>{money(p.price)}</strong>
                              <div className="quantity">
                                <button
                                  aria-label="Diminuir quantidade"
                                  onClick={() =>
                                    shop.quantity(p.id, i.quantity - 1)
                                  }
                                >
                                  <Minus size={12} />
                                </button>
                                {i.quantity}
                                <button
                                  aria-label="Aumentar quantidade"
                                  onClick={() =>
                                    shop.quantity(p.id, i.quantity + 1)
                                  }
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      );
                    })
                  ) : (
                    <div className="empty">
                      <ShoppingBag />
                      <h3>Seu próximo upgrade espera por você.</h3>
                      <p>Explore a coleção e escolha seu favorito.</p>
                    </div>
                  )}
                </div>
                <Link className="btn full" href="/carrinho">
                  Ver carrinho <ArrowRight size={17} />
                </Link>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <nav className="container main-nav">
          <Sheet>
            <SheetTrigger className="all-categories">
              <Menu size={17} />
              Todas as categorias
              <ChevronDown size={13} />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle>Explore DIVINOS GAMES</SheetTitle>
              <div className="nav-links-mobile">
                {shop.categories.map((c) => (
                  <Link href={`/catalogo?categoria=${c.id}`} key={c.id}>
                    {c.name}
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <div className="nav-divider" />
          {shop.categories.map((c) => (
            <Link href={`/catalogo?categoria=${c.id}`} key={c.id}>
              {c.name}
            </Link>
          ))}
          <Link href="/catalogo?ofertas=1" className="offers-link">
            ⚡ Ofertas<span>HOT</span>
          </Link>
          <Link href="/catalogo" className="nav-right">
            Explore seu próximo nível <ArrowRight size={14} />
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <Logo />
              <p>
                Mais que um jogo.
                <br />O seu próximo nível.
              </p>
              <span className="green small">
                ● Sua próxima conquista começa aqui.
              </span>
            </div>
            <div>
              <h4>EXPLORE</h4>
              <Link href="/catalogo">Todos os produtos</Link>
              <Link href="/catalogo?ofertas=1">Ofertas</Link>
              <Link href="/cliente/favoritos">Favoritos</Link>
            </div>
            <div>
              <h4>SUA CONTA</h4>
              <Link href="/cliente/pedidos">Meus pedidos</Link>
              <Link href="/cliente/perfil">Meu perfil</Link>
              <Link href="/login">Entrar / Cadastrar</Link>
            </div>
            <div>
              <h4>PRECISA DE AJUDA?</h4>
              <a href="mailto:contato@divinosgames.com.br">
                contato@divinosgames.com.br
              </a>
              <span>Seg. a sex., das 9h às 18h</span>
              <div className="secure">
                <ShieldCheck size={17} /> Compra segura e protegida
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} DIVINOS GAMES. Todos os direitos
              reservados.
            </span>
            <span>
              VISA &nbsp; Mastercard &nbsp; ◇ Pix &nbsp;{" "}
              <ShieldCheck size={15} />
            </span>
          </div>
        </div>
      </footer>
      <Toaster theme="dark" richColors position="bottom-right" />
    </>
  );
}
