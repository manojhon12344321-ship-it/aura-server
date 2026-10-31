import { ClientPage } from "@/components/account";
export default function Page({ params }: { params: { path?: string[] } }) {
  return <ClientPage path={params.path} />;
}
