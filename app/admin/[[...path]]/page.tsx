"use client";
import dynamic from "next/dynamic";
const Admin = dynamic(() => import("@/components/admin"), {
  ssr: false,
  loading: () => (
    <div className="container page-container animate-pulse">
      Carregando painel DIVINOS GAMES...
    </div>
  ),
});
export default function Page({ params }: { params: { path?: string[] } }) {
  return <Admin path={params.path || []} />;
}
