import i18n from '@/i18n';
import type { Language, LocalizedText, Product } from '@/types';

export function localize(value?: LocalizedText): string {
  if (!value) return '';
  const lang = (i18n.language?.split('-')[0] ?? 'en') as Language;
  return value[lang] || value.en || '';
}

export function formatMoney(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} TJS`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(i18n.language === 'tj' ? 'en-GB' : i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getWholesaleTier(product: Product, quantity: number) {
  return [...product.wholesaleTiers]
    .sort((a, b) => b.minQty - a.minQty)
    .find((tier) => quantity >= tier.minQty);
}

export function getUnitPrice(product: Product, quantity: number): number {
  return getWholesaleTier(product, quantity)?.pricePerUnit ?? product.price;
}
