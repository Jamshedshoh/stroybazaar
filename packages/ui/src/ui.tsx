import Link from "next/link";
import type { ComponentProps } from "react";

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";

export const buttonClass = (variant: Variant = "primary", size: "sm" | "md" = "md") =>
  cx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
    variant === "primary" && "bg-brand-500 text-stone-950 hover:bg-brand-600",
    variant === "secondary" && "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
    variant === "ghost" && "text-stone-700 hover:bg-stone-100",
    variant === "danger" && "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  );

export const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" }) {
  return <Link className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-xl border border-stone-200 bg-white", className)} {...props} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "info" | "danger";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tone === "neutral" && "bg-stone-100 text-stone-700",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "warning" && "bg-amber-50 text-amber-800",
        tone === "info" && "bg-sky-50 text-sky-700",
        tone === "danger" && "bg-red-50 text-red-700",
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-stone-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center text-stone-600">
      <p>{children}</p>
      {action}
    </Card>
  );
}

const ALERT_TONES = {
  error: "bg-red-50 text-red-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
} as const;

export function Alert({ tone = "error", children }: { tone?: keyof typeof ALERT_TONES; children: React.ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cx("rounded-lg px-3 py-2 text-sm", ALERT_TONES[tone])}>
      {children}
    </p>
  );
}
