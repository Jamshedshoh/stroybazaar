import { buttonClass, Card } from "@stroybazaar/ui";
import { logout } from "@/lib/actions";
import { getI18n } from "@/lib/i18n";

export default async function NoAccessPage() {
  const { t } = await getI18n();
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-md space-y-4 p-8 text-center">
        <h1 className="text-xl font-semibold">{t("noAccess.title")}</h1>
        <p className="text-stone-600">{t("noAccess.body")}</p>
        <form action={logout}>
          <button className={buttonClass("secondary")}>{t("nav.logout")}</button>
        </form>
      </Card>
    </div>
  );
}
