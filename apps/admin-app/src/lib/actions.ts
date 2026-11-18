"use server";

import { ApiRequestError, createApiClient, unwrap, type Admin, type Api } from "@stroybazaar/api-client";
import { isLocale } from "@stroybazaar/shared";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { admin, api, homeFor } from "./api";
import { API_URL } from "./config";
import { lines, localized, text } from "./form";
import { getI18n, LOCALE_COOKIE } from "./i18n";
import { normalizePhone } from "./phone";
import { clearToken, setToken } from "./session";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

export interface LoginState extends ActionState {
  step: "phone" | "code";
  phone?: string;
}

async function errorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === "VALIDATION_ERROR") {
      const issues = (error.details?.issues ?? []) as { path?: (string | number)[]; message?: string }[];
      return issues.map((i) => (i.path?.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join(" · ") || error.message;
    }
    return error.message;
  }
  console.error(error);
  return (await getI18n()).t("common.error");
}

/** Runs an API mutation, revalidates `paths`, and turns errors into form state. */
async function mutate(paths: string[], run: () => Promise<unknown>): Promise<ActionState> {
  try {
    await run();
  } catch (error) {
    return { error: await errorMessage(error) };
  }
  for (const path of paths) revalidatePath(path);
  return { ok: true };
}

// Auth

const safeNext = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && value !== "/" ? value : undefined;

export async function requestOtp(_prev: LoginState, form: FormData): Promise<LoginState> {
  const phone = normalizePhone(text(form, "phone"));
  try {
    await unwrap(createApiClient(API_URL).POST("/auth/otp/request", { body: { phone } }));
    return { step: "code", phone };
  } catch (error) {
    return { step: "phone", phone, error: await errorMessage(error) };
  }
}

export async function verifyOtp(prev: LoginState, form: FormData): Promise<LoginState> {
  const phone = text(form, "phone") || prev.phone || "";
  let session: Api["AuthToken"];
  try {
    session = await unwrap(
      createApiClient(API_URL).POST("/auth/otp/verify", { body: { phone, code: text(form, "code") } }),
    );
  } catch (error) {
    return { step: "code", phone, error: await errorMessage(error) };
  }
  await setToken(session.token, session.expiresAt);
  (await cookies()).set(LOCALE_COOKIE, session.user.language, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect(safeNext(form.get("next")) ?? homeFor(session.user.role));
}

export async function logout() {
  await clearToken();
  redirect("/login");
}

export async function setLocale(form: FormData) {
  const locale = form.get("locale");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

// Admin: suppliers

function supplierFields(form: FormData) {
  return {
    name: text(form, "name"),
    location: localized(form, "location"),
    phones: lines(form, "phones"),
    languages: form.getAll("languages").filter(isLocale),
  };
}

export async function createSupplier(_prev: ActionState, form: FormData): Promise<ActionState> {
  let created: Admin["AdminSupplier"];
  try {
    created = await unwrap((await admin()).POST("/suppliers", { body: supplierFields(form) }));
  } catch (error) {
    return { error: await errorMessage(error) };
  }
  revalidatePath("/admin/suppliers");
  redirect(`/admin/suppliers/${created.id}`);
}

export async function updateSupplier(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supplierId = text(form, "supplierId");
  return mutate([`/admin/suppliers/${supplierId}`, "/admin/suppliers"], async () =>
    unwrap((await admin()).PATCH("/suppliers/{supplierId}", { params: { path: { supplierId } }, body: supplierFields(form) })),
  );
}

export async function setSupplierStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supplierId = text(form, "supplierId");
  const status = text(form, "status") as Admin["SupplierStatus"];
  return mutate([`/admin/suppliers/${supplierId}`, "/admin/suppliers", "/admin"], async () =>
    unwrap((await admin()).PATCH("/suppliers/{supplierId}/status", { params: { path: { supplierId } }, body: { status } })),
  );
}

// Admin: categories

export async function createCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  return mutate(["/admin/categories"], async () =>
    unwrap(
      (await admin()).POST("/categories", {
        body: {
          id: text(form, "id"),
          name: localized(form, "name"),
          icon: text(form, "icon") || "box",
          sortOrder: Number(text(form, "sortOrder") || 0),
        },
      }),
    ),
  );
}

export async function updateCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  const categoryId = text(form, "categoryId");
  return mutate(["/admin/categories"], async () =>
    unwrap(
      (await admin()).PATCH("/categories/{categoryId}", {
        params: { path: { categoryId } },
        body: { name: localized(form, "name"), icon: text(form, "icon"), sortOrder: Number(text(form, "sortOrder") || 0) },
      }),
    ),
  );
}

// Admin: users

export async function updateUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const userId = text(form, "userId");
  const role = text(form, "role") as Admin["UserRole"];
  const supplierId = text(form, "supplierId") || null;
  if (role === "supplier" && !supplierId) {
    return { error: (await getI18n()).t("users.supplierRequired") };
  }
  return mutate(["/admin/users"], async () =>
    unwrap(
      (await admin()).PATCH("/users/{userId}", {
        params: { path: { userId } },
        body: { role, ...(role === "supplier" && { supplierId }) },
      }),
    ),
  );
}

// Supplier dashboard

export async function saveProduct(
  productId: string | undefined,
  input: Api["CreateProductRequest"] & { active?: boolean },
): Promise<ActionState> {
  try {
    const client = await api();
    if (productId) {
      await unwrap(client.PATCH("/products/{productId}", { params: { path: { productId } }, body: input }));
    } else {
      await unwrap(client.POST("/products", { body: input }));
    }
  } catch (error) {
    return { error: await errorMessage(error) };
  }
  revalidatePath("/supplier/products");
  redirect("/supplier/products");
}

export async function submitQuote(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rfqId = text(form, "rfqId");
  // Supplier-written text is stored as given, in whatever language they wrote it.
  const note = text(form, "note");
  return mutate([`/supplier/rfqs/${rfqId}`, "/supplier/rfqs"], async () =>
    unwrap(
      (await api()).POST("/rfqs/{rfqId}/quotes", {
        params: { path: { rfqId } },
        body: {
          total: Number(text(form, "total")),
          deliveryDays: Number(text(form, "deliveryDays")),
          note: { en: note, ru: note, tj: note },
        },
      }),
    ),
  );
}

export async function advanceOrder(_prev: ActionState, form: FormData): Promise<ActionState> {
  const orderId = text(form, "orderId");
  const status = text(form, "status") as Api["OrderStatus"];
  return mutate(["/supplier/orders", "/supplier"], async () =>
    unwrap((await api()).PATCH("/orders/{orderId}", { params: { path: { orderId } }, body: { status } })),
  );
}
