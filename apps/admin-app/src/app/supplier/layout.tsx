import { Shell } from "@/components/shell";
import { requireRole } from "@/lib/api";

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireRole(["supplier"], "/supplier");
  return <Shell viewer={viewer}>{children}</Shell>;
}
