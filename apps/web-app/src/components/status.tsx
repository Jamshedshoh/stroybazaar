import type { Api } from "@stroybazaar/api-client";
import type { Translator } from "@stroybazaar/shared";
import type { WebDictionary } from "@/lib/dictionaries";
import { Badge } from "@stroybazaar/ui";

const ORDER_TONES = {
  placed: "neutral",
  confirmed: "info",
  out_for_delivery: "warning",
  delivered: "info",
  confirmed_receipt: "success",
} as const;

export function OrderStatusBadge({ status, i18n }: { status: Api["OrderStatus"]; i18n: Translator<WebDictionary> }) {
  return <Badge tone={ORDER_TONES[status]}>{i18n.t(`status.${status}`)}</Badge>;
}

const RFQ_TONES = { open: "warning", quoted: "info", awarded: "success" } as const;

export function RfqStatusBadge({ status, i18n }: { status: Api["RFQStatus"]; i18n: Translator<WebDictionary> }) {
  return <Badge tone={RFQ_TONES[status]}>{i18n.t(`rfq.status.${status}`)}</Badge>;
}

export const ORDER_STEPS: Api["OrderStatus"][] = [
  "placed",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "confirmed_receipt",
];
