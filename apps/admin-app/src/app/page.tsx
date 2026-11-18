import { redirect } from "next/navigation";
import { homeFor, requireRole } from "@/lib/api";

export default async function Home() {
  const viewer = await requireRole(["admin", "supplier", "buyer"]);
  redirect(homeFor(viewer.role));
}
