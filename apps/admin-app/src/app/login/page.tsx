import { Card } from "@stroybazaar/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/login-form";
import { getViewer, homeFor } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("login.title") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer.role));
  const { t } = await getI18n();
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 font-bold text-stone-950">S</span>
            {t("app.title")}
          </span>
          <LanguageSwitcher />
        </div>
        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <h1 className="text-xl font-semibold">{t("login.title")}</h1>
            <p className="mt-1 text-sm text-stone-600">{t("login.subtitle")}</p>
          </div>
          <LoginForm next={safeNext} devHint={process.env.NODE_ENV !== "production"} />
        </Card>
      </div>
    </div>
  );
}
