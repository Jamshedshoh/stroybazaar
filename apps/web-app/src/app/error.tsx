"use client";

import { useI18n } from "@/components/i18n-provider";
import { buttonClass, EmptyState } from "@stroybazaar/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <EmptyState
      action={
        <button className={buttonClass()} onClick={reset}>
          {t("common.back")}
        </button>
      }
    >
      {t("common.error")}
    </EmptyState>
  );
}
