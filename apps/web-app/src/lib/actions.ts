"use server";

import { ApiRequestError, createApiClient, unwrap, type Api } from "@stroybazaar/api-client";
import { isLocale } from "@stroybazaar/shared";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "./api";
import { API_URL } from "./config";
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
      const issues = (error.details?.issues ?? []) as { message?: string }[];
      return issues.map((issue) => issue.message).filter(Boolean).join(" ") || error.message;
    }
    return error.message;
  }
  console.error(error);
  return (await getI18n()).t("common.error");
}

/** Only allow same-site relative redirects after login. */
const safeNext = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export async function requestOtp(_prev: LoginState, form: FormData): Promise<LoginState> {
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  try {
    await unwrap(createApiClient(API_URL).POST("/auth/otp/request", { body: { phone } }));
    return { step: "code", phone };
  } catch (error) {
    return { step: "phone", phone, error: await errorMessage(error) };
  }
}

export async function verifyOtp(prev: LoginState, form: FormData): Promise<LoginState> {
  const phone = String(form.get("phone") ?? prev.phone ?? "");
  const code = String(form.get("code") ?? "").trim();
  let session: Api["AuthToken"];
  try {
    session = await unwrap(createApiClient(API_URL).POST("/auth/otp/verify", { body: { phone, code } }));
  } catch (error) {
    return { step: "code", phone, error: await errorMessage(error) };
  }
  await setToken(session.token, session.expiresAt);
  (await cookies()).set(LOCALE_COOKIE, session.user.language, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await clearToken();
  redirect("/");
}

export async function setLocale(form: FormData) {
  const locale = form.get("locale");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function updateProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get("name") ?? "").trim();
  const language = form.get("language");
  try {
    await unwrap(
      (await api()).PATCH("/me", {
        body: { ...(name && { name }), ...(isLocale(language) && { language }) },
      }),
    );
    if (isLocale(language)) {
      (await cookies()).set(LOCALE_COOKIE, language, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return { error: await errorMessage(error) };
  }
}

export async function placeOrder(
  input: Api["CreateOrderRequest"],
): Promise<ActionState & { orderId?: string }> {
  try {
    const order = await unwrap((await api()).POST("/orders", { body: input }));
    revalidatePath("/orders");
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { error: await errorMessage(error) };
  }
}

export async function createRfq(input: Api["CreateRFQRequest"]): Promise<ActionState> {
  let rfqId: string;
  try {
    rfqId = (await unwrap((await api()).POST("/rfqs", { body: input }))).id;
  } catch (error) {
    return { error: await errorMessage(error) };
  }
  revalidatePath("/rfqs");
  redirect(`/rfqs/${rfqId}`);
}

export async function awardQuote(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rfqId = String(form.get("rfqId"));
  try {
    await unwrap(
      (await api()).POST("/rfqs/{rfqId}/award", {
        params: { path: { rfqId } },
        body: { quoteId: String(form.get("quoteId")) },
      }),
    );
    revalidatePath(`/rfqs/${rfqId}`);
    return { ok: true };
  } catch (error) {
    return { error: await errorMessage(error) };
  }
}

export async function simulateQuotes(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rfqId = String(form.get("rfqId"));
  try {
    await unwrap((await api()).POST("/rfqs/{rfqId}/quotes/simulate", { params: { path: { rfqId } } }));
    revalidatePath(`/rfqs/${rfqId}`);
    return { ok: true };
  } catch (error) {
    return { error: await errorMessage(error) };
  }
}

export async function confirmReceipt(_prev: ActionState, form: FormData): Promise<ActionState> {
  const orderId = String(form.get("orderId"));
  try {
    await unwrap(
      (await api()).POST("/orders/{orderId}/confirm-receipt", { params: { path: { orderId } } }),
    );
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    return { error: await errorMessage(error) };
  }
}

export async function submitReview(_prev: ActionState, form: FormData): Promise<ActionState> {
  const orderId = String(form.get("orderId"));
  try {
    await unwrap(
      (await api()).POST("/reviews", {
        body: {
          orderId,
          supplierId: String(form.get("supplierId")),
          rating: Number(form.get("rating")),
          comment: String(form.get("comment") ?? ""),
        },
      }),
    );
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    return { error: await errorMessage(error) };
  }
}
