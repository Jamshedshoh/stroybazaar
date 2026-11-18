import type { Admin } from "@stroybazaar/api-client";
import { Field, inputClass, PageHeader, SubmitButton } from "@stroybazaar/ui";
import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { EmptyRow, FilterBar, FilterSelect, Pagination, Table, Td } from "@/components/console-ui";
import { updateUser } from "@/lib/actions";
import { admin, getViewer, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

const ROLES: Admin["UserRole"][] = ["buyer", "supplier", "admin"];

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("users.title") };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; phone?: string; page?: string }>;
}) {
  const query = await searchParams;
  const role = ROLES.includes(query.role as Admin["UserRole"]) ? (query.role as Admin["UserRole"]) : undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const client = await admin();
  const [{ t, date }, viewer, users, suppliers] = await Promise.all([
    getI18n(),
    getViewer(),
    unwrap(client.GET("/users", { params: { query: { role, phone: query.phone || undefined, page, pageSize: 20 } } })),
    unwrap(client.GET("/suppliers", { params: { query: { pageSize: 100 } } })),
  ]);

  return (
    <>
      <PageHeader title={t("users.title")} />
      <FilterBar t={t}>
        <Field label={t("users.phoneFilter")}>
          <input name="phone" defaultValue={query.phone} placeholder="+99292" className={inputClass} />
        </Field>
        <FilterSelect
          label={t("field.role")}
          name="role"
          value={role}
          allLabel={t("common.all")}
          options={ROLES.map((r) => ({ value: r, label: t(`role.${r}`) }))}
        />
      </FilterBar>
      <Table head={[t("field.phone"), t("field.name"), t("common.created"), `${t("field.role")} / ${t("field.supplier")}`]}>
        {users.items.length === 0 && <EmptyRow colSpan={4} t={t} />}
        {users.items.map((user) => (
          <tr key={user.id}>
            <Td className="font-medium whitespace-nowrap">{user.phone}</Td>
            <Td>{user.name ?? "—"}</Td>
            <Td className="whitespace-nowrap text-stone-500">{date(user.createdAt)}</Td>
            <Td>
              {user.id === viewer?.id ? (
                t(`role.${user.role}`)
              ) : (
                <ActionForm action={updateUser} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <select name="role" defaultValue={user.role} className={`${inputClass} w-auto`}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`role.${r}`)}
                      </option>
                    ))}
                  </select>
                  <select name="supplierId" defaultValue={user.supplierId ?? ""} className={`${inputClass} w-auto`}>
                    <option value="">—</option>
                    {suppliers.items.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <SubmitButton size="sm" variant="secondary">
                    {t("common.save")}
                  </SubmitButton>
                </ActionForm>
              )}
            </Td>
          </tr>
        ))}
      </Table>
      <Pagination page={users.page} pageSize={users.pageSize} total={users.total} path="/admin/users" query={{ role, phone: query.phone }} t={t} />
    </>
  );
}
