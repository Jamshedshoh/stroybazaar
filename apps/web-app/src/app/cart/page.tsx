import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { PageHeader } from "@stroybazaar/ui";
import { getSupplierNames, getViewer } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("cart.title") };
}

export default async function CartPage() {
  const [{ t }, viewer, supplierNames] = await Promise.all([getI18n(), getViewer(), getSupplierNames()]);
  return (
    <>
      <PageHeader title={t("cart.title")} />
      <CartView signedIn={viewer?.role === "buyer"} supplierNames={Object.fromEntries(supplierNames)} />
    </>
  );
}
