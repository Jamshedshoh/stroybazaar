import "server-only";
import { cache } from "react";
import { api, requireRole } from "./api";

/** The signed-in supplier user and their supplier profile (null if unlinked or suspended). */
export const getSupplierContext = cache(async () => {
  const viewer = await requireRole(["supplier"], "/supplier");
  if (!viewer.supplierId) return { viewer, supplier: null };
  const { data } = await (await api()).GET("/suppliers/{supplierId}", {
    params: { path: { supplierId: viewer.supplierId } },
  });
  return { viewer, supplier: data ?? null };
});
