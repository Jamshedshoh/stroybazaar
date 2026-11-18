import { LOCALES } from "@stroybazaar/shared";
import { ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { logout, setLocale } from "@/lib/actions";
import { getViewer } from "@/lib/api";
import { getI18n } from "@/lib/i18n";
import { CartCount } from "./cart";
import { buttonClass, cx } from "@stroybazaar/ui";

export const LOCALE_LABELS = { tj: "Тоҷ", ru: "Рус", en: "Eng" } as const;

export async function Header() {
  const [{ t, locale }, viewer] = await Promise.all([getI18n(), getViewer()]);
  const nav = [
    { href: "/catalog", label: t("nav.catalog") },
    { href: "/suppliers", label: t("nav.suppliers") },
    { href: "/rfqs", label: t("nav.rfqs") },
    ...(viewer ? [{ href: "/orders", label: t("nav.orders") }] : []),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 font-bold text-stone-950">S</span>
          <span className="leading-tight">
            <span className="block font-semibold">StroyBazaar</span>
            <span className="hidden text-xs text-stone-500 sm:block">{t("brand.tagline")}</span>
          </span>
        </Link>

        <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={buttonClass("ghost", "sm")}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <form action={setLocale} className="flex rounded-lg border border-stone-200 p-0.5" aria-label={t("language.label")}>
            {LOCALES.map((code) => (
              <button
                key={code}
                name="locale"
                value={code}
                aria-pressed={code === locale}
                className={cx(
                  "rounded-md px-2 py-1 text-xs font-medium",
                  code === locale ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100",
                )}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </form>

          <Link href="/cart" className={cx(buttonClass("ghost", "sm"), "relative")} aria-label={t("nav.cart")}>
            <ShoppingCart className="h-5 w-5" />
            <CartCount />
          </Link>

          {viewer ? (
            <>
              <Link href="/account" className={buttonClass("ghost", "sm")} aria-label={t("nav.account")}>
                <User className="h-5 w-5" />
                <span className="hidden md:inline">{viewer.name ?? viewer.phone}</span>
              </Link>
              <form action={logout}>
                <button className={buttonClass("ghost", "sm")}>{t("nav.logout")}</button>
              </form>
            </>
          ) : (
            <Link href="/login" className={buttonClass("primary", "sm")}>
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
