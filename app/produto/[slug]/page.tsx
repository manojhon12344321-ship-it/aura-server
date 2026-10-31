import { products } from "@/lib/data";
import { ProductPage } from "@/components/public-pages";
import { createClient } from "@supabase/supabase-js";
async function getProduct(slug: string) {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    const { data } = await client
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    return data;
  }
  return products.find((p) => p.slug === slug);
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const p = await getProduct(params.slug);
  return {
    title: p?.name || "Produto",
    description: p?.description,
    openGraph: { images: p?.images || [] },
  };
}
export default async function Page({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  return <ProductPage slug={params.slug} initial={p} />;
}
