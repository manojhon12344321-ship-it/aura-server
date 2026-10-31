const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;
export default {
  images: {
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: "https", hostname: supabaseHost }] : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.igdb.com" },
    ],
  },
  experimental: { cpus: 2 },
};
