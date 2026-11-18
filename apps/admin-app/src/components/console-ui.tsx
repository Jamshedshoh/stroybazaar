import type { Admin, Api } from "@stroybazaar/api-client";
import type { Translator } from "@stroybazaar/shared";
import { Badge, buttonClass, cx, Field, inputClass } from "@stroybazaar/ui";
import Link from "next/link";
import type { AdminDictionary } from "@/lib/dictionaries";

type T = Translator<AdminDictionary>;

export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
          <tr>
            {head.map((cell, i) => (
              <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cx("px-4 py-3 align-middle", className)}>{children}</td>;
}

export function EmptyRow({ colSpan, t }: { colSpan: number; t: T["t"] }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-stone-500">
        {t("common.empty")}
      </td>
    </tr>
  );
}

/** Previous/next links that keep the current query string. */
export function Pagination({
  page,
  pageSize,
  total,
  path,
  query,
  t,
}: {
  page: number;
  pageSize: number;
  total: number;
  path: string;
  query: Record<string, string | undefined>;
  t: T["t"];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams(Object.entries(query).filter((e): e is [string, string] => Boolean(e[1])));
    params.set("page", String(p));
    return `${path}?${params}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-stone-500">{t("common.page", { page, pages })}</span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className={buttonClass("secondary", "sm")}>
            {t("common.prev")}
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className={buttonClass("secondary", "sm")}>
            {t("common.next")}
          </Link>
        )}
      </div>
    </div>
  );
}

/** Three inputs named `<name>.en`, `<name>.ru`, `<name>.tj`. */
export function LocalizedInputs({
  name,
  label,
  value,
  t,
  required = true,
}: {
  name: string;
  label: string;
  value?: Api["LocalizedText"];
  t: T["t"];
  required?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-sm font-medium text-stone-700">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {(
          [
            ["ru", "field.nameRu"],
            ["tj", "field.nameTj"],
            ["en", "field.nameEn"],
          ] as const
        ).map(([lang, langLabel]) => (
          <label key={lang} className="block">
            <span className="text-xs text-stone-500">{t(langLabel)}</span>
            <input name={`${name}.${lang}`} defaultValue={value?.[lang]} required={required} className={inputClass} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

const SUPPLIER_TONES = { pending: "warning", verified: "success", suspended: "danger" } as const;
export function SupplierStatusBadge({ status, t }: { status: Admin["SupplierStatus"]; t: T["t"] }) {
  return <Badge tone={SUPPLIER_TONES[status]}>{t(`supplierStatus.${status}`)}</Badge>;
}

const ORDER_TONES = {
  placed: "neutral",
  confirmed: "info",
  out_for_delivery: "warning",
  delivered: "info",
  confirmed_receipt: "success",
} as const;
export function OrderStatusBadge({ status, t }: { status: Api["OrderStatus"]; t: T["t"] }) {
  return <Badge tone={ORDER_TONES[status]}>{t(`orderStatus.${status}`)}</Badge>;
}

const RFQ_TONES = { open: "warning", quoted: "info", awarded: "success" } as const;
export function RfqStatusBadge({ status, t }: { status: Api["RFQStatus"]; t: T["t"] }) {
  return <Badge tone={RFQ_TONES[status]}>{t(`rfqStatus.${status}`)}</Badge>;
}

/** A GET form for list filters. */
export function FilterBar({ children, t }: { children: React.ReactNode; t: T["t"] }) {
  return (
    <form className="mb-4 flex flex-wrap items-end gap-3">
      {children}
      <button className={buttonClass("secondary")}>{t("common.filter")}</button>
    </form>
  );
}

export function FilterSelect({
  label,
  name,
  value,
  options,
  allLabel,
}: {
  label: string;
  name: string;
  value?: string;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <Field label={label}>
      <select name={name} defaultValue={value ?? ""} className={inputClass}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export const ORDER_STATUSES: Api["OrderStatus"][] = ["placed", "confirmed", "out_for_delivery", "delivered", "confirmed_receipt"];
export const SUPPLIER_STATUSES: Admin["SupplierStatus"][] = ["pending", "verified", "suspended"];
