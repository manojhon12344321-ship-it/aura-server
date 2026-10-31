"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  UserRound,
  LogOut,
  Package,
  Tags,
  Ticket,
  Users,
  Star,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useShop } from "@/lib/store";
import { money, Order } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "./product-card";
import { toast } from "sonner";
export const statusNames: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
export function AccountLayout({
  admin = false,
  path,
  children,
}: {
  admin?: boolean;
  path: string[];
  children: React.ReactNode;
}) {
  const shop = useShop();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    if (!supabase && !useShop.getState().user && !admin)
      router.replace("/login?next=/cliente");
  }, [admin, router]);
  const links = admin
    ? [
        ["", "Visão geral", LayoutDashboard],
        ["produtos", "Produtos", Package],
        ["categorias", "Categorias", Tags],
        ["pedidos", "Pedidos", ShoppingBag],
        ["cupons", "Cupons", Ticket],
        ["clientes", "Clientes", Users],
        ["avaliacoes", "Avaliações", Star],
        ["config", "Configurações", Settings],
      ]
    : [
        ["", "Visão geral", LayoutDashboard],
        ["pedidos", "Meus pedidos", ShoppingBag],
        ["favoritos", "Meus favoritos", Heart],
        ["perfil", "Meu perfil", UserRound],
      ];
  if (!ready)
    return (
      <div className="container page-container">
        <div className="panel animate-pulse h-80" />
      </div>
    );
  return (
    <div className="container page-container">
      <div className="breadcrumb">
        DIVINOS GAMES / {admin ? "Administração" : "Minha conta"}
      </div>
      {admin && !supabase && (
        <div className="panel small purple mb-5">
          Painel demonstrativo local. Alterações ficam neste navegador. Em
          produção, o acesso exige autenticação e perfil administrador.
        </div>
      )}
      <div className="account-layout">
        <aside className="sidebar">
          <div className="sidebar-user">
            <span>{shop.user?.name?.[0] || "D"}</span>
            <div>
              <b className="text-xs">{shop.user?.name || "DIVINOS GAMES"}</b>
              <small>
                {admin ? "ADMINISTRADOR" : "BEM-VINDO AO SEU UNIVERSO"}
              </small>
            </div>
          </div>
          {links.map(([slug, title, Icon]) => (
            <Link
              key={String(slug)}
              className={(path[0] || "") === slug ? "active" : ""}
              href={`/${admin ? "admin" : "cliente"}/${slug}`}
            >
              <Icon size={16} />
              {String(title)}
            </Link>
          ))}
          <button
            onClick={async () => {
              await supabase?.auth.signOut();
              shop.setUser(null);
              router.push("/");
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
export function OrdersTable({
  orders,
  admin = false,
}: {
  orders: Order[];
  admin?: boolean;
}) {
  return orders.length ? (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Pedido</th>
            {admin && (
              <>
                <th>Cliente</th>
                <th>Cupom</th>
              </>
            )}
            <th>Data</th>
            <th>Total</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id.slice(0, 8)}</td>
              {admin && (
                <>
                  <td>{o.shipping_address.name || o.user_id.slice(0, 8)}</td>
                  <td>{o.coupon_code || "—"}</td>
                </>
              )}
              <td>{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
              <td>{money(o.total)}</td>
              <td>
                {admin ? (
                  <StatusSelect order={o} />
                ) : (
                  <span className={`status ${o.status}`}>
                    {statusNames[o.status]}
                  </span>
                )}
              </td>
              <td>
                <Link
                  className="purple"
                  href={`/${admin ? "admin" : "cliente"}/pedidos/${o.id}`}
                >
                  Ver <ArrowRight size={12} className="inline" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="empty">
      <ShoppingBag />
      <h3>Sua história começa no primeiro pedido.</h3>
      <p>Quando fizer uma compra, ela aparecerá aqui.</p>
      <Link href="/catalogo" className="btn">
        Explorar produtos
      </Link>
    </div>
  );
}
export function StatusSelect({ order }: { order: Order }) {
  const shop = useShop();
  const [busy, setBusy] = useState(false);
  return (
    <select
      aria-label={`Status do pedido ${order.id}`}
      value={order.status}
      disabled={busy}
      onChange={async (e) => {
        const status = e.target.value;
        setBusy(true);
        if (supabase) {
          const { error } = await supabase
            .from("orders")
            .update({ status })
            .eq("id", order.id);
          if (error) {
            toast.error(error.message);
            setBusy(false);
            return;
          }
        }
        shop.updateOrder(order.id, status);
        toast.success("Status atualizado");
        setBusy(false);
      }}
    >
      {Object.entries(statusNames).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
export function OrderDetail({
  id,
  admin = false,
}: {
  id: string;
  admin?: boolean;
}) {
  const shop = useShop();
  const order = shop.orders.find((o) => o.id === id);
  if (!order)
    return (
      <div className="panel empty">
        <h2>Pedido não encontrado</h2>
      </div>
    );
  const steps = ["pending", "paid", "shipped", "delivered"];
  return (
    <>
      <h1 className="page-title">Pedido #{order.id.slice(0, 8)}</h1>
      <p className="page-subtitle">
        Realizado em {new Date(order.created_at).toLocaleString("pt-BR")}
      </p>
      <div className="panel mb-5">
        {admin && <StatusSelect order={order} />}
        <div className="timeline">
          {order.status === "cancelled" ? (
            <div>Pedido cancelado</div>
          ) : (
            steps.map((s, i) => (
              <div
                className={i <= steps.indexOf(order.status) ? "done" : ""}
                key={s}
              >
                {statusNames[s]}
                <small>
                  {i <= steps.indexOf(order.status)
                    ? "Etapa confirmada"
                    : "Aguardando próxima etapa"}
                </small>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="panel mb-5">
        <h3 className="mb-4">Itens do pedido</h3>
        {order.items.map((i) => (
          <div className="mini-cart" key={i.product_id}>
            <Image src={i.image} width={60} height={60} alt={i.name} />
            <div>
              {i.name}
              <strong>
                {i.quantity} × {money(i.price)}
              </strong>
            </div>
          </div>
        ))}
        <div className="summary-row total">
          <span>Total</span>
          <strong>{money(order.total)}</strong>
        </div>
        <button
          className="btn outline"
          onClick={() => {
            order.items.forEach((i) => shop.add(i.product_id, i.quantity));
            toast.success("Itens disponíveis adicionados ao carrinho");
          }}
        >
          Comprar novamente
        </button>
      </div>
      <div className="panel">
        <h3 className="mb-3">Endereço de entrega</h3>
        <p className="page-subtitle">
          {Object.values(order.shipping_address).filter(Boolean).join(" · ")}
        </p>
        <p className="small muted">
          Pagamento: {order.payment_method.replace("mock_", "")} (demonstrativo)
        </p>
      </div>
    </>
  );
}
export function ClientPage({ path = [] }: { path?: string[] }) {
  const shop = useShop();
  useEffect(() => {
    if (supabase && shop.user)
      void supabase
        .from("orders")
        .select("*,items:order_items(*)")
        .eq("user_id", shop.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) useShop.setState({ orders: data });
        });
  }, [shop.user?.id]);
  const orders = shop.orders.filter((o) => o.user_id === shop.user?.id);
  let content;
  if (path[0] === "pedidos")
    content = path[1] ? (
      <OrderDetail id={path[1]} />
    ) : (
      <>
        <h1 className="page-title">Meus pedidos</h1>
        <div className="panel">
          <OrdersTable orders={orders} />
        </div>
      </>
    );
  else if (path[0] === "favoritos")
    content = (
      <>
        <h1 className="page-title">Sua lista de desejos.</h1>
        <p className="page-subtitle">Guarde hoje. Conquiste amanhã.</p>
        {shop.wishlist.length ? (
          <div className="product-grid">
            {shop.catalog
              .filter((p) => shop.wishlist.includes(p.id))
              .map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
          </div>
        ) : (
          <div className="panel empty">
            <Heart />
            <h3>Seus favoritos moram aqui.</h3>
            <p>
              Toque no coração dos produtos para salvar seu próximo upgrade.
            </p>
            <Link className="btn" href="/catalogo">
              Explorar coleção
            </Link>
          </div>
        )}
      </>
    );
  else if (path[0] === "perfil") content = <Profile />;
  else
    content = (
      <>
        <span className="eyebrow purple">SEU UNIVERSO GAMER</span>
        <h1 className="page-title mt-3">
          Olá, {shop.user?.name.split(" ")[0] || "gamer"}.
        </h1>
        <p className="page-subtitle">Bem-vindo ao seu próximo nível.</p>
        <div className="stats-grid">
          <div className="stat-card">
            <small>Total investido no seu setup</small>
            <strong>
              {money(
                orders
                  .filter((o) => o.status !== "cancelled")
                  .reduce((s, o) => s + o.total, 0),
              )}
            </strong>
          </div>
          <div className="stat-card">
            <small>Pedidos realizados</small>
            <strong>{orders.length}</strong>
          </div>
          <div className="stat-card">
            <small>Favoritos</small>
            <strong>{shop.wishlist.length}</strong>
          </div>
          <div className="stat-card">
            <small>Em andamento</small>
            <strong>
              {
                orders.filter(
                  (o) => !["delivered", "cancelled"].includes(o.status),
                ).length
              }
            </strong>
          </div>
        </div>
        <div className="panel">
          <h2 className="text-xl mb-4">Últimas conquistas</h2>
          <OrdersTable orders={orders.slice(0, 5)} />
        </div>
      </>
    );
  return <AccountLayout path={path}>{content}</AccountLayout>;
}
function Profile() {
  const shop = useShop();
  const [avatar, setAvatar] = useState(shop.user?.avatar_url || "");
  return (
    <>
      <h1 className="page-title">Meu perfil</h1>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get("name"));
          if (supabase) {
            const { error } = await supabase
              .from("profiles")
              .update({ name, avatar_url: avatar })
              .eq("id", shop.user?.id);
            if (error) {
              toast.error(error.message);
              return;
            }
          }
          if (shop.user)
            shop.setUser({ ...shop.user, name, avatar_url: avatar });
          toast.success("Perfil atualizado");
        }}
      >
        {avatar && (
          <Image
            src={avatar}
            unoptimized
            width={80}
            height={80}
            alt="Avatar"
            className="rounded-full mb-5"
          />
        )}
        <label className="field">
          Avatar
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Máximo de 5 MB");
                return;
              }
              if (supabase) {
                const key = `${shop.user?.id}/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
                const { error } = await supabase.storage
                  .from("avatars")
                  .upload(key, file);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                setAvatar(
                  supabase.storage.from("avatars").getPublicUrl(key).data
                    .publicUrl,
                );
              } else {
                const reader = new FileReader();
                reader.onload = () => setAvatar(String(reader.result));
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
        <label className="field">
          Nome
          <input
            name="name"
            defaultValue={shop.user?.name}
            minLength={3}
            required
          />
        </label>
        <label className="field">
          E-mail
          <input value={shop.user?.email || ""} readOnly />
        </label>
        <button className="btn">Salvar alterações</button>
      </form>
    </>
  );
}
