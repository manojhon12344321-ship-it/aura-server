import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (
    code &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const jar = cookies();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => jar.getAll(),
          setAll: (
            values: { name: string; value: string; options: CookieOptions }[],
          ) =>
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            ),
        },
      },
    );
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await client.auth.getUser();
      const { data } = await client
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();
      return NextResponse.redirect(
        new URL(data?.role === "admin" ? "/admin" : "/", url.origin),
      );
    }
  }
  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
