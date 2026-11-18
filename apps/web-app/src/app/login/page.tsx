import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Card } from "@stroybazaar/ui";
import { getViewer } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("login.title") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getViewer()) redirect(safeNext);
  const { t } = await getI18n();

  return (
    <Card className="mx-auto max-w-md space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">{t("login.title")}</h1>
        <p className="mt-1 text-sm text-stone-600">{t("login.subtitle")}</p>
      </div>
      <LoginForm next={safeNext} devHint={process.env.NODE_ENV !== "production"} />
    </Card>
  );
}
