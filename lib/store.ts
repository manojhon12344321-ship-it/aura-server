"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, products, Order, categories } from "./data";
import { supabase } from "./supabase";
type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client";
  avatar_url?: string;
};
type State = {
  reviewStats: Record<string, { count: number; average: number }>;
  settings: {
    store_name: string;
    logo_url: string;
    hero_url: string;
    free_shipping: number;
  };
  cart: { product_id: string; quantity: number }[];
  wishlist: string[];
  catalog: Product[];
  categories: typeof categories;
  orders: Order[];
  user: User | null;
  add: (id: string, quantity?: number) => void;
  quantity: (id: string, n: number) => void;
  favorite: (id: string) => void;
  setUser: (u: User | null) => void;
  saveProduct: (p: Product) => void;
  removeProduct: (id: string) => void;
  setCatalog: (p: Product[]) => void;
  addOrder: (o: Order) => void;
  updateOrder: (id: string, status: string) => void;
  clear: () => void;
};
export const useShop = create<State>()(
  persist(
    (set, get) => ({
      reviewStats: {},
      settings: {
        store_name: "DIVINOS GAMES",
        logo_url: "",
        hero_url: "",
        free_shipping: 499,
      },
      cart: [],
      wishlist: [],
      catalog: products,
      categories,
      orders: [],
      user: null,
      add: (id, quantity = 1) => {
        const p = get().catalog.find((p) => p.id === id);
        if (!p || p.stock <= 0 || quantity <= 0) return;
        set((s) => ({
          cart: [
            ...s.cart.filter((i) => i.product_id !== id),
            {
              product_id: id,
              quantity: Math.min(
                p.stock,
                (s.cart.find((i) => i.product_id === id)?.quantity || 0) +
                  quantity,
              ),
            },
          ],
        }));
        syncCart(get());
      },
      quantity: (id, n) => {
        const stock = get().catalog.find((p) => p.id === id)?.stock || 0;
        set((s) => ({
          cart:
            n <= 0
              ? s.cart.filter((i) => i.product_id !== id)
              : s.cart.map((i) =>
                  i.product_id === id
                    ? { ...i, quantity: Math.min(n, stock) }
                    : i,
                ),
        }));
        syncCart(get());
      },
      favorite: (id) => {
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((x) => x !== id)
            : [...s.wishlist, id],
        }));
        if (supabase && get().user) {
          const user_id = get().user!.id;
          if (get().wishlist.includes(id))
            void supabase.from("wishlist").upsert({ user_id, product_id: id });
          else
            void supabase
              .from("wishlist")
              .delete()
              .eq("user_id", user_id)
              .eq("product_id", id);
        }
      },
      setUser: (user) =>
        set((s) => ({
          user,
          ...(s.user && s.user.id !== user?.id
            ? { orders: [], cart: [], wishlist: [] }
            : {}),
        })),
      saveProduct: (p) =>
        set((s) => ({
          catalog: [...s.catalog.filter((x) => x.id !== p.id), p],
        })),
      removeProduct: (id) =>
        set((s) => ({ catalog: s.catalog.filter((p) => p.id !== id) })),
      setCatalog: (catalog) => set({ catalog }),
      addOrder: (o) =>
        set((s) => ({
          orders: [o, ...s.orders],
          cart: [],
          catalog: s.catalog.map((p) => ({
            ...p,
            stock:
              p.stock -
              (o.items.find((i) => i.product_id === p.id)?.quantity || 0),
          })),
        })),
      updateOrder: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
      clear: () => set({ cart: [] }),
    }),
    {
      name: "divinos-games-v1",
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        catalog: s.catalog,
        orders: s.orders,
        user: s.user,
        categories: s.categories,
        settings: s.settings,
      }),
    },
  ),
);
let cartQueue: Promise<void> = Promise.resolve();
function syncCart(s: State) {
  if (!supabase || !s.user) return;
  const userId = s.user.id;
  const items = s.cart.map((i) => ({ ...i, user_id: userId }));
  cartQueue = cartQueue
    .catch(() => {})
    .then(async () => {
      const { error: removeError } = await supabase!
        .from("cart_items")
        .delete()
        .eq("user_id", userId);
      if (removeError) throw removeError;
      if (items.length) {
        const { error } = await supabase!.from("cart_items").insert(items);
        if (error) throw error;
      }
    })
    .catch((error) => {
      console.error("Não foi possível sincronizar o carrinho:", error.message);
    });
}
