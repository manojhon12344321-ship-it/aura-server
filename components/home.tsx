"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Gamepad2,
  Disc3,
  Headphones,
  Monitor,
  Truck,
  ShieldCheck,
  CreditCard,
  Headset,
  Zap,
  ChevronRight,
  Mail,
  ArrowUpRight,
} from "lucide-react";
import { ImageCarousel } from "./ui/image-carousel";
import { ProductCard } from "./product-card";
import { useShop } from "@/lib/store";
import { toast } from "sonner";
const banners = [
  {
    tag: "O SEU PRÓXIMO NÍVEL",
    title: (
      <>
        Jogue além.
        <br />
        <span>Viva o extraordinário.</span>
      </>
    ),
    text: "Os melhores consoles, jogos e acessórios.<br/>Para quem leva a diversão a sério.",
    image: "banner-console",
    cta: "Explore os produtos",
    href: "/catalogo",
  },
  {
    tag: "POTÊNCIA PARA CADA PARTIDA",
    title: (
      <>
        Seu setup.
        <br />
        <span>Sem limites.</span>
      </>
    ),
    text: "Performance que acompanha o seu ritmo.<br/>Conheça nossa seleção PC Gamer.",
    image: "banner-setup",
    cta: "Monte seu próximo nível",
    href: "/catalogo?categoria=pc-gamer",
  },
  {
    tag: "CADA DETALHE IMPORTA",
    title: (
      <>
        Sinta o jogo.
        <br />
        <span>Domine a partida.</span>
      </>
    ),
    text: "Precisão, conforto e imersão em cada movimento.<br/>Acessórios feitos para vencer.",
    image: "banner-controller",
    cta: "Conheça os acessórios",
    href: "/catalogo?categoria=acessorios",
  },
  {
    tag: "NOVAS HISTÓRIAS ESPERAM",
    title: (
      <>
        Aperte o play.
        <br />
        <span>Comece sua aventura.</span>
      </>
    ),
    text: "Mundos incríveis e experiências inesquecíveis.<br/>Encontre seu próximo jogo favorito.",
    image: "banner-games",
    cta: "Descubra os jogos",
    href: "/catalogo?categoria=jogos",
  },
];
export function Home() {
  const { catalog, categories, settings } = useShop();
  const [timer, setTimer] = useState(8 * 3600 + 47 * 60 + 32);
  useEffect(() => {
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const icons = [Gamepad2, Disc3, Headphones, Monitor];
  return (
    <>
      <section className="hero-wrap container">
        <ImageCarousel variant="hero">
          {banners.map((b, i) => (
            <div className={`hero-banner hero-${i}`} key={i}>
              <div className="hero-background">
                <Image
                  src={
                    i === 0 && settings?.hero_url
                      ? settings.hero_url
                      : `/images/${b.image}.jpg`
                  }
                  unoptimized
                  alt="Setup gamer DIVINOS GAMES"
                  fill
                  priority={i === 0}
                  sizes="100vw"
                />
              </div>
              <div className="hero-content">
                <div className="eyebrow">
                  <span /> DIVINOS GAMES • {b.tag}
                </div>
                <h1>{b.title}</h1>
                <p dangerouslySetInnerHTML={{ __html: b.text }} />
                <Link className="btn" href={b.href}>
                  {b.cta}
                  <ArrowRight size={18} />
                </Link>
                <div className="hero-trust">
                  <div className="avatar-stack">
                    <span>G</span>
                    <span>R</span>
                    <span>M</span>
                    <span>J</span>
                  </div>
                  <div>
                    <span className="stars">★★★★★</span>
                    <small>Produto original. Garantia de 12 meses.</small>
                  </div>
                </div>
              </div>
              <div className="hero-label">
                <span className="green">●</span> NEXT LEVEL EXPERIENCE{" "}
                <ArrowUpRight size={14} />
              </div>
              <span className="hero-watermark">
                PLAY
                <br />
                BEYOND.
              </span>
            </div>
          ))}
        </ImageCarousel>
      </section>
      <section className="container benefits">
        {[
          {
            icon: Truck,
            title: "Frete grátis",
            text: "Em compras acima de R$ 499",
          },
          {
            icon: ShieldCheck,
            title: "100% originais",
            text: "Garantia e nota fiscal em tudo",
          },
          {
            icon: CreditCard,
            title: "Até 12x sem juros",
            text: "Seu upgrade cabe no bolso",
          },
          {
            icon: Headset,
            title: "De gamer para gamer",
            text: "Suporte que entende você",
          },
        ].map((b) => (
          <div key={b.title}>
            <b.icon size={23} />
            <span>
              <strong>{b.title}</strong>
              <small>{b.text}</small>
            </span>
          </div>
        ))}
      </section>
      <section className="container category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">ENCONTRE O SEU UNIVERSO</span>
            <h2>Qual é o seu próximo upgrade?</h2>
          </div>
          <Link href="/catalogo">
            Todas as categorias <ArrowRight size={15} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => {
            const Icon = icons[i % 4];
            return (
              <Link
                className={`category-tile category-${i}`}
                href={`/catalogo?categoria=${c.id}`}
                key={c.id}
              >
                <div className="category-icon">
                  <Icon size={30} />
                </div>
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {
                      [
                        "A próxima geração está aqui",
                        "Novas histórias. Novas conquistas.",
                        "Cada detalhe faz a diferença",
                        "Performance sem limites",
                      ][i % 4]
                    }
                  </small>
                </span>
                <ArrowUpRight size={18} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="container product-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">
              <span className="green">↗</span> OS FAVORITOS DA COMUNIDADE
            </span>
            <h2>
              Os mais desejados<span className="purple">.</span>
            </h2>
          </div>
          <Link href="/catalogo">
            Ver todos os produtos <ArrowRight size={15} />
          </Link>
        </div>
        <ImageCarousel variant="products">
          {catalog
            .filter((p) => p.is_active)
            .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
            .slice(0, 8)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </ImageCarousel>
      </section>
      <section className="container promo-banners">
        <Link
          href="/catalogo?categoria=consoles"
          className="promo promo-console"
        >
          <Image src="/images/ps5.jpg" alt="PlayStation 5" fill sizes="50vw" />
          <div>
            <span className="eyebrow">O FUTURO É AGORA</span>
            <h2>
              Nova geração.
              <br />
              Novas possibilidades.
            </h2>
            <span>
              Conheça os consoles <ArrowRight size={16} />
            </span>
          </div>
        </Link>
        <Link
          href="/catalogo?categoria=acessorios"
          className="promo promo-gear"
        >
          <Image
            src="/images/headset.jpg"
            alt="Headset gamer"
            fill
            sizes="50vw"
          />
          <div>
            <span className="eyebrow green">SEU SETUP MERECE</span>
            <h2>
              Pequenos upgrades.
              <br />
              Grandes vitórias.
            </h2>
            <span>
              Explore os acessórios <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      </section>
      <section className="flash-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow purple">
                <Zap size={13} /> OPORTUNIDADES QUE NÃO ESPERAM
              </span>
              <h2>
                Ofertas relâmpago <Zap className="purple" size={25} />
              </h2>
            </div>
            <div className="countdown">
              <small>Termina em</small>
              {[
                Math.floor(timer / 3600),
                Math.floor((timer % 3600) / 60),
                timer % 60,
              ].map((v, i) => (
                <span key={i}>
                  {String(v).padStart(2, "0")}
                  <small>{["HORAS", "MIN", "SEG"][i]}</small>
                </span>
              ))}
            </div>
          </div>
          <ImageCarousel variant="products">
            {catalog
              .filter((p) => p.is_active && p.stock > 0)
              .slice(4, 12)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </ImageCarousel>
        </div>
      </section>
      <section className="container product-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">ESCOLHIDOS PARA O SEU SETUP</span>
            <h2>
              Seu próximo nível está aqui<span className="purple">.</span>
            </h2>
          </div>
          <Link href="/catalogo">
            Explorar coleção <ArrowRight size={15} />
          </Link>
        </div>
        <div className="product-grid">
          {catalog
            .filter((p) => p.is_active)
            .slice(0, 8)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <section className="container brands">
        <p>QUEM JOGA SÉRIO, JOGA COM AS MELHORES.</p>
        <div>
          <span className="brand-playstation">♧ PlayStation</span>
          <span>⊗ XBOX</span>
          <span className="brand-nintendo">Nintendo</span>
          <span>
            hyper<span className="purple">X</span>
          </span>
          <span>logitech G</span>
          <span>RAZER</span>
        </div>
      </section>
      <section className="container">
        <div className="newsletter">
          <div className="newsletter-icon">
            <Mail size={29} />
          </div>
          <div>
            <span className="eyebrow purple">FAÇA PARTE DO JOGO</span>
            <h2>Seu próximo upgrade. Em primeira mão.</h2>
            <p>
              Ofertas exclusivas, lançamentos e novidades. Sem spam, só coisa
              boa.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector("input");
              const email = input?.value || "";
              const list = JSON.parse(
                localStorage.getItem("divinos-newsletter") || "[]",
              );
              localStorage.setItem(
                "divinos-newsletter",
                JSON.stringify([...new Set([...list, email])]),
              );
              toast.success("Inscrição salva neste navegador.");
              e.currentTarget.reset();
            }}
          >
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              aria-label="E-mail para newsletter"
              required
            />
            <button className="btn">
              Quero fazer parte <ArrowRight size={16} />
            </button>
            <small>
              Ao se cadastrar, você concorda em receber nossas novidades.
            </small>
          </form>
        </div>
      </section>
    </>
  );
}
