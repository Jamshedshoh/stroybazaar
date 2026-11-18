export interface PriceTiers {
  price: number;
  wholesaleTiers: { minQty: number; pricePerUnit: number }[];
}

/** Display estimate matching the server's rule: the best wholesale tier the quantity unlocks. */
export function estimateUnitPrice(product: PriceTiers, quantity: number) {
  return product.wholesaleTiers.reduce(
    (best, tier) => (quantity >= tier.minQty && tier.pricePerUnit < best ? tier.pricePerUnit : best),
    product.price,
  );
}
