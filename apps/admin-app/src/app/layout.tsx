import type { Metadata } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import { dictionaries } from "@/lib/dictionaries";
import { getI18n } from "@/lib/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: t("app.title"), template: `%s · ${t("app.title")}` }, robots: { index: false } };
}

const HTML_LANG = { tj: "tg", ru: "ru", en: "en" } as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getI18n();
  return (
    <html lang={HTML_LANG[locale]}>
      <body className="min-h-screen antialiased">
        <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
