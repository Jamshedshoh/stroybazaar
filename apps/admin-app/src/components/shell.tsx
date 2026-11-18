import type { Api } from "@stroybazaar/api-client";
import { buttonClass } from "@stroybazaar/ui";
import {
  BarChart3,
  ClipboardList,
  Coins,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { logout } from "@/lib/actions";
import type { AdminDictionary } from "@/lib/dictionaries";
import { getI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { NavLink } from "./nav-link";

type NavItem = { href: string; label: keyof AdminDictionary; icon: React.ReactNode; exact?: boolean };

const ICON = "h-4 w-4";

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "nav.dashboard", icon: <BarChart3 className={ICON} />, exact: true },
  { href: "/admin/suppliers", label: "nav.suppliers", icon: <Store className={ICON} /> },
  { href: "/admin/categories", label: "nav.categories", icon: <Tags className={ICON} /> },
  { href: "/admin/users", label: "nav.users", icon: <Users className={ICON} /> },
  { href: "/admin/orders", label: "nav.orders", icon: <Receipt className={ICON} /> },
  { href: "/admin/commissions", label: "nav.commissions", icon: <Coins className={ICON} /> },
];

const SUPPLIER_NAV: NavItem[] = [
  { href: "/supplier", label: "nav.overview", icon: <LayoutDashboard className={ICON} />, exact: true },
  { href: "/supplier/products", label: "nav.products", icon: <Package className={ICON} /> },
  { href: "/supplier/rfqs", label: "nav.rfqs", icon: <ClipboardList className={ICON} /> },
  { href: "/supplier/orders", label: "nav.orders", icon: <Receipt className={ICON} /> },
];

export async function Shell({ viewer, children }: { viewer: Api["User"]; children: React.ReactNode }) {
  const { t } = await getI18n();
  const nav = viewer.role === "admin" ? ADMIN_NAV : SUPPLIER_NAV;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-stone-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 font-bold text-stone-950">S</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">StroyBazaar</span>
            <span className="block text-xs text-stone-500">{t(`role.${viewer.role}`)}</span>
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} exact={item.exact}>
              {item.icon}
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <div className="hidden space-y-3 border-t border-stone-200 p-4 lg:block">
          <p className="truncate text-sm text-stone-600">{viewer.name ?? viewer.phone}</p>
          <LanguageSwitcher />
          <form action={logout}>
            <button className={`${buttonClass("ghost", "sm")} w-full justify-start`}>
              <LogOut className={ICON} /> {t("nav.logout")}
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-end gap-2 border-b border-stone-200 bg-white px-4 py-2 lg:hidden">
          <LanguageSwitcher />
          <form action={logout}>
            <button className={buttonClass("ghost", "sm")} aria-label={t("nav.logout")}>
              <LogOut className={ICON} />
            </button>
          </form>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
