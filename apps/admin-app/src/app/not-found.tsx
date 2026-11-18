import { ButtonLink, EmptyState } from "@stroybazaar/ui";
import { getI18n } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="py-16">
      <EmptyState action={<ButtonLink href="/">{t("common.back")}</ButtonLink>}>{t("common.empty")}</EmptyState>
    </div>
  );
}
