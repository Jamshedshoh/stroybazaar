import type { Metadata } from "next";
import { CartProvider } from "@/components/cart";
import { Header } from "@/components/header";
import { I18nProvider } from "@/components/i18n-provider";
import { dictionaries } from "@/lib/dictionaries";
import { getI18n } from "@/lib/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: "StroyBazaar", template: "%s · StroyBazaar" }, description: t("brand.tagline") };
}

const HTML_LANG = { tj: "tg", ru: "ru", en: "en" } as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  return (
    <html lang={HTML_LANG[locale]}>
      <body className="min-h-screen antialiased">
        <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
          <CartProvider>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
              StroyBazaar · {t("brand.tagline")}
            </footer>
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
