import { Badge, ButtonLink, PageHeader } from "@stroybazaar/ui";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyRow, Table, Td } from "@/components/console-ui";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("products.title") };
}

export default async function ProductsPage() {
  const client = await api();
  const [{ t, text, money, number }, products, categories] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/me/products")),
    unwrap(client.GET("/categories")),
  ]);
  const categoryName = new Map(categories.map((c) => [c.id, text(c.name)]));

  return (
    <>
      <PageHeader
        title={t("products.title")}
        action={
          <ButtonLink href="/supplier/products/new">
            <Plus className="h-4 w-4" /> {t("products.new")}
          </ButtonLink>
        }
      />
      <Table head={[t("field.name"), t("field.category"), t("field.price"), t("field.tiers"), t("field.stock"), ""]}>
        {products.length === 0 && <EmptyRow colSpan={6} t={t} />}
        {products.map((product) => (
          <tr key={product.id} className={product.active ? "" : "text-stone-400"}>
            <Td>
              <Link href={`/supplier/products/${product.id}`} className="font-medium hover:text-brand-700">
                {text(product.name)}
              </Link>
            </Td>
            <Td>{categoryName.get(product.categoryId) ?? product.categoryId}</Td>
            <Td className="whitespace-nowrap">
              {money(product.price)} / {text(product.unit)}
            </Td>
            <Td className="text-xs">
              {product.wholesaleTiers.map((tier) => `≥${number(tier.minQty)}: ${money(tier.pricePerUnit)}`).join(" · ") || "—"}
            </Td>
            <Td>{number(product.stock)}</Td>
            <Td>{!product.active && <Badge>{t("products.hidden")}</Badge>}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
