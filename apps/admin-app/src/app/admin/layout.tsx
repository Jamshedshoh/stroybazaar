import { Shell } from "@/components/shell";
import { requireRole } from "@/lib/api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireRole(["admin"], "/admin");
  return <Shell viewer={viewer}>{children}</Shell>;
}
