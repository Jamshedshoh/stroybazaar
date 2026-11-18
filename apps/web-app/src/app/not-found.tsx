import { ButtonLink, EmptyState } from "@stroybazaar/ui";
import { getI18n } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <EmptyState action={<ButtonLink href="/">{t("common.home")}</ButtonLink>}>
      <span className="block text-lg font-medium text-stone-900">{t("common.notFoundTitle")}</span>
    </EmptyState>
  );
}
