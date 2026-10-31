import { Suspense } from "react";
import { Auth } from "@/components/public-pages";
export default function Page() {
  return (
    <Suspense>
      <Auth register />
    </Suspense>
  );
}
