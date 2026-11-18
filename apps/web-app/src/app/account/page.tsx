import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { Card, PageHeader } from "@stroybazaar/ui";
import { requireViewer } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("account.title") };
}

export default async function AccountPage() {
  const viewer = await requireViewer("/account");
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t("account.title")} />
      <Card className="space-y-6 p-6">
        <div>
          <p className="text-sm text-stone-500">{t("account.phone")}</p>
          <p className="font-medium">{viewer.phone}</p>
        </div>
        <ProfileForm name={viewer.name ?? ""} language={viewer.language} />
      </Card>
    </div>
  );
}
