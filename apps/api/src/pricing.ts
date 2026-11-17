import { Prisma } from "@stroybazaar/db";

interface Priced {
  price: Prisma.Decimal;
  wholesaleTiers: { minQty: number; pricePerUnit: Prisma.Decimal }[];
}

/** Unit price for a quantity: the best wholesale tier the quantity unlocks, else the retail price. */
export function unitPriceFor(product: Priced, quantity: number) {
  let best = product.price;
  for (const tier of product.wholesaleTiers) {
    if (quantity >= tier.minQty && tier.pricePerUnit.lessThan(best)) best = tier.pricePerUnit;
  }
  return best;
}

export const roundMoney = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
