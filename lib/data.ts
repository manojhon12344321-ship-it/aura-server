export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price: number;
  cost: number;
  stock: number;
  sku: string;
  category_id: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
};
export const categories = [
  { id: "consoles", name: "Consoles", slug: "consoles", icon: "Gamepad2" },
  { id: "jogos", name: "Jogos", slug: "jogos", icon: "Disc3" },
  {
    id: "acessorios",
    name: "Acessórios",
    slug: "acessorios",
    icon: "Headphones",
  },
  { id: "pc-gamer", name: "PC Gamer", slug: "pc-gamer", icon: "Monitor" },
];
const rows: [string, number, number, string, string, number][] = [
  ["PlayStation 5 Slim • 1TB", 3499.9, 3999.9, "consoles", "ps5", 18],
  [
    "Controle DualSense • Midnight Black",
    399.9,
    499.9,
    "acessorios",
    "controller",
    8,
  ],
  ["Headset Gamer HyperX Cloud III", 499.9, 649.9, "acessorios", "headset", 12],
  ["Nintendo Switch OLED • 64GB", 2199.9, 2599.9, "consoles", "switch", 6],
  ["PC Gamer RTX 4060 • Ryzen 5", 4599.9, 5499.9, "pc-gamer", "setup", 3],
  ["God of War Ragnarök • PS5", 199.9, 299.9, "jogos", "hero", 23],
  ["Xbox Series X • 1TB", 3899.9, 4499.9, "consoles", "controller", 7],
  ["Teclado Mecânico RGB Pro", 249.9, 349.9, "acessorios", "setup", 15],
  ["Marvel’s Spider-Man 2 • PS5", 249.9, 349.9, "jogos", "hero", 10],
  ["Mouse Gamer Logitech G Pro", 349.9, 449.9, "acessorios", "setup", 20],
  ["Monitor Gamer 27” • 165Hz", 1199.9, 1499.9, "pc-gamer", "setup", 4],
  ["EA Sports FC 25 • PS5", 189.9, 299.9, "jogos", "ps5", 0],
];
export const products: Product[] = rows.map((r, i) => ({
  id: `demo-${i + 1}`,
  name: r[0],
  slug: r[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, ""),
  price: r[1],
  compare_price: r[2],
  category_id: r[3],
  images: [
    `/images/${r[4]}.jpg`,
    ...["controller", "ps5", "headset", "setup"].map((v) => `/images/${v}.jpg`),
  ],
  stock: r[5],
  cost: r[1] * 0.65,
  sku: `DG-${String(i + 1).padStart(4, "0")}`,
  description:
    "Uma nova dimensão para o seu setup. Desempenho excepcional, design icônico e a qualidade que acompanha cada conquista. Produto original, com nota fiscal e garantia de 12 meses. Viva cada detalhe da sua próxima partida com DIVINOS GAMES.",
  is_featured: i < 4,
  is_active: true,
}));
export const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export type Order = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  payment_method: string;
  shipping_address: Record<string, string>;
  coupon_code: string;
  created_at: string;
  items: {
    product_id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
  }[];
};
