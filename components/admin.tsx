"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Star,
  Trash2,
  Pencil,
  UploadCloud,
  Copy,
  Check,
  X,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useShop } from "@/lib/store";
import { Product, money } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { AccountLayout, OrdersTable, OrderDetail } from "./account";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export default function Admin({ path }: { path: string[] }) {
  const shop = useShop();
  useEffect(() => {
    if (supabase)
      void supabase
        .from("orders")
        .select("*,items:order_items(*)")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) useShop.setState({ orders: data });
        });
  }, []);
  let content;
  if (path[0] === "produtos")
    content =
      path[1] === "novo" || path[2] === "editar" ? (
        <ProductForm id={path[2] === "editar" ? path[1] : undefined} />
      ) : (
        <ProductsTable />
      );
  else if (path[0] === "pedidos")
    content = path[1] ? (
      <OrderDetail admin id={path[1]} />
    ) : (
      <>
        <h1 className="page-title">Pedidos</h1>
        <div className="panel">
          <OrdersTable orders={shop.orders} admin />
        </div>
      </>
    );
  else if (path[0] === "categorias") content = <CategoryManager />;
  else if (path[0] === "cupons") content = <CouponManager />;
  else if (path[0] === "clientes") content = <Clients />;
  else if (path[0] === "avaliacoes") content = <Reviews />;
  else if (path[0] === "config") content = <Settings />;
  else content = <Dashboard />;
  return (
    <AccountLayout admin path={path}>
      {content}
    </AccountLayout>
  );
}
function Dashboard() {
  const shop = useShop();
  const today = new Date().toDateString();
  const todays = shop.orders.filter(
    (o) =>
      new Date(o.created_at).toDateString() === today &&
      o.status !== "cancelled",
  );
  const revenue = todays.reduce((s, o) => s + o.total, 0);
  const low = shop.catalog.filter((p) => p.stock < 5);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      vendas: shop.orders
        .filter(
          (o) =>
            new Date(o.created_at).toDateString() === d.toDateString() &&
            o.status !== "cancelled",
        )
        .reduce((s, o) => s + o.total, 0),
    };
  });
  return (
    <>
      <span className="eyebrow purple">DIVINOS GAMES • CONTROLE TOTAL</span>
      <h1 className="page-title mt-3">Seu negócio no próximo nível.</h1>
      <p className="page-subtitle">Acompanhe cada conquista da sua loja.</p>
      <div className="stats-grid">
        {[
          ["Vendas hoje", money(revenue)],
          ["Pedidos hoje", String(todays.length)],
          ["Estoque baixo", String(low.length)],
          ["Ticket médio", money(todays.length ? revenue / todays.length : 0)],
        ].map(([label, value], i) => (
          <div className="stat-card" key={label}>
            <small>{label}</small>
            <strong className={i === 2 ? "text-red-400" : ""}>{value}</strong>
          </div>
        ))}
      </div>
      <div className="panel mb-5">
        <h2 className="text-xl mb-6">Vendas nos últimos 7 dias</h2>
        <div style={{ height: 240, width: "100%" }}>
          <ResponsiveContainer>
            <AreaChart data={days}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#29242f" vertical={false} />
              <XAxis dataKey="day" stroke="#82758e" fontSize={10} />
              <YAxis stroke="#82758e" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "#19151f",
                  border: "1px solid #453451",
                  borderRadius: 10,
                }}
                formatter={(v: number) => money(v)}
              />
              <Area
                type="monotone"
                dataKey="vendas"
                stroke="#a178ff"
                fill="url(#sales)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {low.length > 0 && (
        <div className="panel mb-5">
          <h3 className="flex items-center gap-2 text-red-300 mb-4">
            <AlertTriangle size={17} /> Atenção ao estoque
          </h3>
          {low.map((p) => (
            <div className="summary-row" key={p.id}>
              <Link href={`/admin/produtos/${p.id}/editar`}>{p.name}</Link>
              <span className="text-red-400">{p.stock} unidades</span>
            </div>
          ))}
        </div>
      )}
      <div className="panel">
        <h2 className="text-xl mb-4">Pedidos recentes</h2>
        <OrdersTable orders={shop.orders.slice(0, 5)} admin />
      </div>
    </>
  );
}
function ProductsTable() {
  const shop = useShop();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Product | null>(null);
  async function patch(
    p: Product,
    key: "is_active" | "is_featured",
    value: boolean,
  ) {
    if (supabase) {
      const { error } = await supabase
        .from("products")
        .update({ [key]: value })
        .eq("id", p.id);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    shop.saveProduct({ ...p, [key]: value });
    toast.success("Produto atualizado");
  }
  return (
    <>
      <h1 className="page-title">Produtos</h1>
      <p className="page-subtitle">Gerencie cada upgrade da sua coleção.</p>
      <div className="toolbar">
        <input
          aria-label="Buscar produtos no painel"
          placeholder="Buscar produto ou SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link className="btn" href="/admin/produtos/novo">
          <Plus size={15} />
          Novo produto
        </Link>
      </div>
      <div className="panel table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {[
                "Produto",
                "Categoria",
                "Preço",
                "Estoque",
                "Ativo",
                "Destaque",
                "Ações",
              ].map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shop.catalog
              .filter((p) =>
                `${p.name} ${p.sku}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((p) => (
                <tr key={p.id}>
                  <td>
                    <div>
                      <Image src={p.images[0]} alt="" width={40} height={40} />
                      <span>
                        {p.name}
                        <small className="block muted mt-1">{p.sku}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    {shop.categories.find((c) => c.id === p.category_id)?.name}
                  </td>
                  <td className="whitespace-nowrap">{money(p.price)}</td>
                  <td
                    className={
                      p.stock < 5
                        ? "text-red-400"
                        : p.stock <= 10
                          ? "text-yellow-400"
                          : "green"
                    }
                  >
                    {p.stock}
                  </td>
                  <td>
                    <Switch
                      aria-label={`Ativar ${p.name}`}
                      checked={p.is_active}
                      onCheckedChange={(v) => void patch(p, "is_active", v)}
                    />
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      aria-label="Destacar produto"
                      onClick={() =>
                        void patch(p, "is_featured", !p.is_featured)
                      }
                    >
                      <Star
                        size={16}
                        fill={p.is_featured ? "#a378ff" : "none"}
                      />
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        className="icon-btn"
                        aria-label="Editar produto"
                        href={`/admin/produtos/${p.id}/editar`}
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        className="icon-btn"
                        aria-label="Excluir produto"
                        onClick={() => setDeleting(p)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Dialog
        open={!!deleting}
        onOpenChange={(v) => {
          if (!v) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Excluir produto?</DialogTitle>
          <DialogDescription>
            {deleting?.name}. Esta ação remove o produto do catálogo.
          </DialogDescription>
          <button
            className="btn bg-red-600"
            onClick={async () => {
              if (!deleting) return;
              if (supabase) {
                const { error } = await supabase
                  .from("products")
                  .delete()
                  .eq("id", deleting.id);
                if (error) {
                  toast.error(
                    "Não é possível excluir um produto com pedidos. Desative-o.",
                  );
                  return;
                }
              }
              shop.removeProduct(deleting.id);
              setDeleting(null);
              toast.success("Produto excluído");
            }}
          >
            Confirmar exclusão
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
const productSchema = z
  .object({
    name: z.string().min(3, "Mínimo 3 caracteres"),
    slug: z
      .string()
      .min(3)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use letras minúsculas, números e hífens",
      ),
    description: z
      .string()
      .min(20, "Descreva o produto com pelo menos 20 caracteres"),
    price: z.coerce.number().positive("Preço precisa ser maior que zero"),
    compare_price: z.coerce.number().min(0),
    cost: z.coerce.number().min(0),
    stock: z.coerce.number().int().min(0),
    sku: z.string().min(3),
    category_id: z.string().min(1, "Selecione uma categoria"),
    is_featured: z.boolean(),
    is_active: z.boolean(),
  })
  .refine((p) => !p.compare_price || p.compare_price >= p.price, {
    path: ["compare_price"],
    message: "Preço anterior deve ser maior ou igual ao preço atual",
  });
function ProductForm({ id }: { id?: string }) {
  const shop = useShop();
  const router = useRouter();
  const original = shop.catalog.find((p) => p.id === id);
  const [images, setImages] = useState<string[]>(original?.images || []);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(-1);
  const form = useForm<z.input<typeof productSchema>, unknown, z.output<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: original || {
      name: "",
      slug: "",
      description: "",
      price: 0,
      compare_price: 0,
      cost: 0,
      stock: 0,
      sku: "",
      category_id: "",
      is_featured: false,
      is_active: true,
    },
  });
  const price = Number(form.watch("price"));
  const compare = Number(form.watch("compare_price"));
  const cost = Number(form.watch("cost"));
  async function upload(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024
        ) {
          toast.error(`${file.name}: use JPG, PNG ou WebP até 5 MB`);
          continue;
        }
        if (supabase) {
          const key = `products/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
          const { error } = await supabase.storage
            .from("product-images")
            .upload(key, file);
          if (error) throw error;
          uploaded.push(
            supabase.storage.from("product-images").getPublicUrl(key).data
              .publicUrl,
          );
        } else
          uploaded.push(
            await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
          );
      }
      setImages((current) => [...current, ...uploaded]);
      toast.success("Imagens adicionadas. Arraste para reordenar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setBusy(false);
    }
  }
  async function save(data: z.infer<typeof productSchema>) {
    if (!images.length) {
      toast.error("Adicione ao menos uma imagem");
      return;
    }
    if (
      shop.catalog.some(
        (p) => p.id !== id && (p.sku === data.sku || p.slug === data.slug),
      )
    ) {
      toast.error("SKU ou slug já cadastrado");
      return;
    }
    setBusy(true);
    let p: Product = { ...data, images, id: id || crypto.randomUUID() };
    if (supabase) {
      const result = id
        ? await supabase
            .from("products")
            .update(p)
            .eq("id", id)
            .select()
            .single()
        : await supabase.from("products").insert(p).select().single();
      if (result.error) {
        toast.error(result.error.message);
        setBusy(false);
        return;
      }
      p = result.data;
    }
    shop.saveProduct(p);
    toast.success("Produto salvo com sucesso");
    router.push("/admin/produtos");
  }
  return (
    <>
      <h1 className="page-title">
        {id ? "Editar produto" : "Novo upgrade na coleção."}
      </h1>
      <p className="page-subtitle">
        Preencha cada detalhe para uma experiência extraordinária.
      </p>
      <form className="panel" onSubmit={form.handleSubmit(save)}>
        <div className="form-grid">
          {[
            ["name", "Nome do produto"],
            ["slug", "Slug (URL)"],
            ["sku", "SKU único"],
            ["stock", "Estoque"],
            ["price", "Preço de venda (R$)"],
            ["compare_price", "Preço anterior (R$)"],
            ["cost", "Custo (R$)"],
          ].map(([key, label]) => (
            <label className="field" key={key}>
              {label}
              <input
                type={
                  ["price", "compare_price", "cost", "stock"].includes(key)
                    ? "number"
                    : "text"
                }
                step={key === "stock" ? "1" : "0.01"}
                {...form.register(key as keyof z.infer<typeof productSchema>)}
                onChange={(e) => {
                  void form
                    .register(key as keyof z.infer<typeof productSchema>)
                    .onChange(e);
                  if (key === "name" && !id)
                    form.setValue("slug", slugify(e.target.value));
                }}
              />
              {form.formState.errors[
                key as keyof z.infer<typeof productSchema>
              ] && (
                <span className="field-error">
                  {
                    form.formState.errors[
                      key as keyof z.infer<typeof productSchema>
                    ]?.message
                  }
                </span>
              )}
            </label>
          ))}
          <label className="field">
            Categoria
            <select {...form.register("category_id")}>
              <option value="">Selecione</option>
              {shop.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="field-error">
              {form.formState.errors.category_id?.message}
            </span>
          </label>
          <label className="field span-2">
            Descrição
            <textarea rows={5} {...form.register("description")} />
            <span className="field-error">
              {form.formState.errors.description?.message}
            </span>
          </label>
        </div>
        <div className="summary-row">
          <span>
            Desconto:{" "}
            <b className="green">
              {compare > price ? Math.round((1 - price / compare) * 100) : 0}%
            </b>
          </span>
          <span>
            Lucro bruto: <b className="purple">{money(price - cost)}</b>
          </span>
        </div>
        <h3 className="mb-4">Galeria do produto</h3>
        <div
          className="upload-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void upload(e.dataTransfer.files);
          }}
        >
          <UploadCloud className="mx-auto mb-3 purple" />
          <p>Arraste suas imagens ou selecione os arquivos</p>
          <input
            aria-label="Enviar imagens do produto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => void upload(e.target.files)}
          />
          <p className="small muted mt-3">
            JPG, PNG ou WebP • até 5 MB por imagem
          </p>
        </div>
        <div className="upload-grid">
          {images.map((src, i) => (
            <div
              className="upload-preview"
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (drag < 0) return;
                const next = [...images];
                const [image] = next.splice(drag, 1);
                next.splice(i, 0, image);
                setImages(next);
                setDrag(-1);
              }}
              key={src + i}
            >
              <Image
                src={src}
                alt={`Imagem ${i + 1}`}
                unoptimized
                fill
                sizes="120px"
              />
              <button
                type="button"
                aria-label="Definir imagem principal"
                onClick={() =>
                  setImages([src, ...images.filter((_, n) => n !== i)])
                }
              >
                <Star size={13} fill={i === 0 ? "#b38aff" : "none"} />
              </button>
              <button
                type="button"
                aria-label="Remover imagem"
                onClick={() => setImages(images.filter((_, n) => n !== i))}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-8 mb-6">
          <label className="flex items-center gap-3 text-xs">
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
            />
            Produto ativo
          </label>
          <label className="flex items-center gap-3 text-xs">
            <Switch
              checked={form.watch("is_featured")}
              onCheckedChange={(v) => form.setValue("is_featured", v)}
            />
            Destaque na home
          </label>
        </div>
        <button className="btn" disabled={busy}>
          {busy ? "Salvando..." : "Salvar produto"}
        </button>
        <Link className="btn outline ml-3" href="/admin/produtos">
          Cancelar
        </Link>
      </form>
    </>
  );
}
function CategoryManager() {
  const shop = useShop();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    slug: string;
    icon: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  useEffect(() => {
    if (supabase)
      void supabase
        .from("categories")
        .select("*")
        .then(({ data }) => {
          if (data) useShop.setState({ categories: data });
        });
  }, []);
  return (
    <>
      <div className="toolbar">
        <h1 className="page-title">Categorias</h1>
        <button
          className="btn"
          onClick={() => {
            setEditing(null);
            setName("");
            setSlug("");
            setOpen(true);
          }}
        >
          <Plus size={14} />
          Nova categoria
        </button>
      </div>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Slug</th>
              <th>Ícone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {shop.categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>{c.icon}</td>
                <td>
                  <div className="flex gap-3">
                    <button
                      className="icon-btn"
                      aria-label="Editar categoria"
                      onClick={() => {
                        setEditing(c);
                        setName(c.name);
                        setSlug(c.slug);
                        setOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Excluir categoria"
                      onClick={async () => {
                        if (shop.catalog.some((p) => p.category_id === c.id)) {
                          toast.error(
                            "Mova os produtos desta categoria antes de excluir",
                          );
                          return;
                        }
                        if (supabase) {
                          const { error } = await supabase
                            .from("categories")
                            .delete()
                            .eq("id", c.id);
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                        }
                        useShop.setState({
                          categories: shop.categories.filter(
                            (x) => x.id !== c.id,
                          ),
                        });
                        toast.success("Categoria excluída");
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{editing ? "Editar" : "Nova"} categoria</DialogTitle>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const category = {
                id: editing?.id || crypto.randomUUID(),
                name,
                slug,
                icon: String(data.get("icon")),
              };
              if (
                shop.categories.some(
                  (c) => c.id !== category.id && c.slug === slug,
                )
              ) {
                toast.error("Slug já existe");
                return;
              }
              if (supabase) {
                const { error } = await supabase
                  .from("categories")
                  .upsert(category);
                if (error) {
                  toast.error(error.message);
                  return;
                }
              }
              useShop.setState({
                categories: [
                  ...shop.categories.filter((c) => c.id !== category.id),
                  category,
                ],
              });
              setOpen(false);
              toast.success("Categoria salva");
            }}
          >
            <label className="field">
              Nome
              <input
                value={name}
                required
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(slugify(e.target.value));
                }}
              />
            </label>
            <label className="field">
              Slug
              <input
                value={slug}
                required
                pattern="[a-z0-9-]+"
                onChange={(e) => setSlug(e.target.value)}
              />
            </label>
            <label className="field">
              Ícone
              <select name="icon" defaultValue={editing?.icon || "Gamepad2"}>
                {[
                  "Gamepad2",
                  "Disc3",
                  "Headphones",
                  "Monitor",
                  "Keyboard",
                  "Mouse",
                ].map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
            <button className="btn">Salvar categoria</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
};
function CouponManager() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  useEffect(() => {
    if (supabase)
      void supabase
        .from("coupons")
        .select("*")
        .then(({ data }) => setItems(data || []));
    else
      setItems(
        JSON.parse(localStorage.getItem("divinos-demo-coupons") || "null") || [
          {
            id: "1",
            code: "DIVINOS10",
            discount_type: "percent",
            value: 10,
            min_order: 0,
            max_uses: 1000,
            used_count: 0,
            expires_at: "2027-12-31",
            is_active: true,
          },
          {
            id: "2",
            code: "BEMVINDO50",
            discount_type: "fixed",
            value: 50,
            min_order: 250,
            max_uses: 500,
            used_count: 0,
            expires_at: "2027-12-31",
            is_active: true,
          },
        ],
      );
  }, []);
  function update(next: Coupon[]) {
    setItems(next);
    if (!supabase)
      localStorage.setItem("divinos-demo-coupons", JSON.stringify(next));
  }
  return (
    <>
      <div className="toolbar">
        <h1 className="page-title">Cupons</h1>
        <button
          className="btn"
          onClick={() => {
            setCode("");
            setOpen(true);
          }}
        >
          <Plus size={14} />
          Criar cupom
        </button>
      </div>
      <div className="panel table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {["Código", "Desconto", "Mínimo", "Usos", "Expira", "Ativo"].map(
                (t) => (
                  <th key={t}>{t}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <button
                    className="flex gap-2 items-center"
                    onClick={() => {
                      void navigator.clipboard.writeText(c.code);
                      toast.success("Código copiado");
                    }}
                  >
                    {c.code}
                    <Copy size={12} />
                  </button>
                </td>
                <td>
                  {c.discount_type === "percent"
                    ? `${c.value}%`
                    : money(c.value)}
                </td>
                <td>{money(c.min_order)}</td>
                <td>
                  {c.used_count}/{c.max_uses || "∞"}
                </td>
                <td>
                  {c.expires_at
                    ? new Date(c.expires_at).toLocaleDateString("pt-BR")
                    : "Sem prazo"}
                </td>
                <td>
                  <Switch
                    aria-label={`Ativar cupom ${c.code}`}
                    checked={c.is_active}
                    onCheckedChange={async (v) => {
                      if (supabase) {
                        const { error } = await supabase
                          .from("coupons")
                          .update({ is_active: v })
                          .eq("id", c.id);
                        if (error) {
                          toast.error(error.message);
                          return;
                        }
                      }
                      update(
                        items.map((x) =>
                          x.id === c.id ? { ...x, is_active: v } : x,
                        ),
                      );
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Novo cupom</DialogTitle>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              const type = String(d.get("discount_type"));
              const value = Number(d.get("value"));
              if (type === "percent" && value > 100) {
                toast.error("Percentual máximo de 100%");
                return;
              }
              const c: Coupon = {
                id: crypto.randomUUID(),
                code: code.toUpperCase(),
                discount_type: type,
                value,
                min_order: Number(d.get("min_order")),
                max_uses: Number(d.get("max_uses")),
                used_count: 0,
                expires_at: String(d.get("expires_at")),
                is_active: true,
              };
              if (items.some((x) => x.code === c.code)) {
                toast.error("Código já existe");
                return;
              }
              if (supabase) {
                const { error } = await supabase
                  .from("coupons")
                  .insert({ ...c, expires_at: c.expires_at || null });
                if (error) {
                  toast.error(error.message);
                  return;
                }
              }
              update([...items, c]);
              setOpen(false);
              toast.success("Cupom criado");
            }}
          >
            <label className="field">
              Código
              <div className="flex gap-2">
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className="btn outline"
                  onClick={() =>
                    setCode(
                      `DIVINOS${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                    )
                  }
                >
                  Gerar
                </button>
              </div>
            </label>
            <div className="form-grid">
              <label className="field">
                Tipo
                <select name="discount_type">
                  <option value="percent">Percentual</option>
                  <option value="fixed">Valor fixo</option>
                </select>
              </label>
              {[
                ["value", "Valor"],
                ["min_order", "Pedido mínimo"],
                ["max_uses", "Máximo de usos"],
              ].map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  <input
                    type="number"
                    name={key}
                    min={key === "value" ? 1 : 0}
                    step={key === "max_uses" ? 1 : 0.01}
                    required
                    defaultValue={key === "value" ? 10 : 0}
                  />
                </label>
              ))}
            </div>
            <label className="field">
              Expira em
              <input type="date" name="expires_at" />
            </label>
            <button className="btn">Criar cupom</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
function Clients() {
  const shop = useShop();
  const [clients, setClients] = useState<
    { id: string; name: string; email?: string }[]
  >([]);
  useEffect(() => {
    if (supabase)
      void supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .then(({ data }) => setClients(data || []));
    else if (shop.user) setClients([shop.user]);
  }, [shop.user]);
  return (
    <>
      <h1 className="page-title">Clientes</h1>
      <div className="panel table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Pedidos</th>
              <th>Total gasto</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const orders = shop.orders.filter(
                (o) => o.user_id === c.id && o.status !== "cancelled",
              );
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{orders.length}</td>
                  <td>{money(orders.reduce((s, o) => s + o.total, 0))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!clients.length && (
          <div className="empty">
            <h3>A comunidade está começando.</h3>
            <p>Os clientes cadastrados aparecerão aqui.</p>
          </div>
        )}
      </div>
    </>
  );
}
function Reviews() {
  const [items, setItems] = useState<
    {
      id: string;
      rating: number;
      comment: string;
      is_approved: boolean;
      products?: { name: string };
      profiles?: { name: string };
    }[]
  >([]);
  useEffect(() => {
    if (supabase)
      void supabase
        .from("reviews")
        .select("*,products(name),profiles(name)")
        .eq("is_approved", false)
        .then(({ data }) => setItems(data || []));
    else
      setItems(
        JSON.parse(localStorage.getItem("divinos-reviews") || "[]").filter(
          (r: { is_approved: boolean }) => !r.is_approved,
        ),
      );
  }, []);
  return (
    <>
      <h1 className="page-title">Avaliações pendentes</h1>
      <div className="panel">
        {items.length ? (
          items.map((r) => (
            <div className="review" key={r.id}>
              <strong>
                {r.profiles?.name} · {r.products?.name}
              </strong>
              <span className="stars"> {"★".repeat(r.rating)}</span>
              <p>{r.comment}</p>
              <div className="flex gap-3 mt-4">
                <button
                  className="btn"
                  onClick={async () => {
                    if (supabase) {
                      const { error } = await supabase
                        .from("reviews")
                        .update({ is_approved: true })
                        .eq("id", r.id);
                      if (error) {
                        toast.error(error.message);
                        return;
                      }
                    } else {
                      const all = JSON.parse(
                        localStorage.getItem("divinos-reviews") || "[]",
                      );
                      localStorage.setItem(
                        "divinos-reviews",
                        JSON.stringify(
                          all.map((x: { id: string }) =>
                            x.id === r.id ? { ...x, is_approved: true } : x,
                          ),
                        ),
                      );
                    }
                    setItems(items.filter((x) => x.id !== r.id));
                    toast.success("Avaliação aprovada");
                  }}
                >
                  <Check size={14} />
                  Aprovar
                </button>
                <button
                  className="btn outline"
                  onClick={async () => {
                    if (supabase) {
                      const { error } = await supabase
                        .from("reviews")
                        .delete()
                        .eq("id", r.id);
                      if (error) {
                        toast.error(error.message);
                        return;
                      }
                    } else {
                      const all = JSON.parse(
                        localStorage.getItem("divinos-reviews") || "[]",
                      );
                      localStorage.setItem(
                        "divinos-reviews",
                        JSON.stringify(
                          all.filter((x: { id: string }) => x.id !== r.id),
                        ),
                      );
                    }
                    setItems(items.filter((x) => x.id !== r.id));
                    toast.success("Avaliação removida");
                  }}
                >
                  <X size={14} />
                  Reprovar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <Star />
            <h3>Tudo em dia.</h3>
            <p>Nenhuma avaliação aguardando aprovação.</p>
          </div>
        )}
      </div>
    </>
  );
}
function Settings() {
  const [settings, setSettings] = useState({
    store_name: "DIVINOS GAMES",
    logo_url: "",
    hero_url: "",
    free_shipping: 499,
  });
  useEffect(() => {
    if (supabase)
      void supabase
        .from("settings")
        .select("value")
        .eq("id", "store")
        .single()
        .then(({ data }) => {
          if (data) setSettings(data.value);
        });
    else {
      const saved = localStorage.getItem("divinos-settings");
      if (saved) setSettings(JSON.parse(saved));
    }
  }, []);
  return (
    <>
      <h1 className="page-title">Configurações da loja</h1>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (supabase) {
            const { error } = await supabase
              .from("settings")
              .upsert({ id: "store", value: settings });
            if (error) {
              toast.error(error.message);
              return;
            }
          } else
            localStorage.setItem("divinos-settings", JSON.stringify(settings));
          useShop.setState({ settings });
          toast.success("Configurações salvas");
        }}
      >
        <label className="field">
          Nome oficial
          <input value="DIVINOS GAMES" readOnly />
        </label>
        <label className="field">
          URL do logo
          <input
            type="url"
            value={settings.logo_url}
            onChange={(e) =>
              setSettings({ ...settings, logo_url: e.target.value })
            }
          />
        </label>
        <label className="field">
          URL do banner hero
          <input
            type="url"
            value={settings.hero_url}
            onChange={(e) =>
              setSettings({ ...settings, hero_url: e.target.value })
            }
          />
        </label>
        <label className="field">
          Frete grátis a partir de (R$)
          <input
            type="number"
            min={0}
            value={settings.free_shipping}
            onChange={(e) =>
              setSettings({
                ...settings,
                free_shipping: Number(e.target.value),
              })
            }
          />
        </label>
        <button className="btn">Salvar configurações</button>
      </form>
    </>
  );
}
