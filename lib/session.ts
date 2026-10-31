import { supabase } from "./supabase";
import { useShop } from "./store";
/** Restore account state after password login; keep the guest's pending upgrades. */
export async function restoreShopping(userId: string) {
  if (!supabase) return;
  const [remoteCart, remoteWishlist] = await Promise.all([
    supabase
      .from("cart_items")
      .select("product_id,quantity")
      .eq("user_id", userId),
    supabase.from("wishlist").select("product_id").eq("user_id", userId),
  ]);
  if (remoteCart.error || remoteWishlist.error) return;
  const state = useShop.getState();
  if (state.user?.id !== userId) return;
  const cart = new Map(
    (remoteCart.data || []).map((i) => [i.product_id, i.quantity]),
  );
  for (const item of state.cart)
    cart.set(
      item.product_id,
      Math.max(cart.get(item.product_id) || 0, item.quantity),
    );
  const items = [...cart]
    .filter(([id]) => !id.startsWith("demo-"))
    .map(([product_id, quantity]) => ({ product_id, quantity }));
  const wishlist = [
    ...new Set([
      ...(remoteWishlist.data || []).map((i) => i.product_id),
      ...state.wishlist,
    ]),
  ].filter((id) => !id.startsWith("demo-"));
  useShop.setState({ cart: items, wishlist });
  if (items.length)
    await supabase
      .from("cart_items")
      .upsert(items.map((i) => ({ ...i, user_id: userId })));
  if (wishlist.length)
    await supabase
      .from("wishlist")
      .upsert(wishlist.map((product_id) => ({ product_id, user_id: userId })));
}
