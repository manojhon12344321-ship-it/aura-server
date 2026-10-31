import { Suspense } from "react";
import { Catalog } from "@/components/public-pages";
export default function Page() {
  return (
    <Suspense>
      <Catalog />
    </Suspense>
  );
}
