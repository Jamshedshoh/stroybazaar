"use client";

import type { Api } from "@stroybazaar/api-client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  productId: string;
  supplierId: string;
  quantity: number;
  // Snapshot for display; the server recomputes prices when the order is placed.
  name: Api["LocalizedText"];
  unit: Api["LocalizedText"];
  price: number;
  wholesaleTiers: Api["WholesaleTier"][];
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  add: (item: CartItem) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productIds: string[]) => void;
}

const STORAGE_KEY = "stroybazaar.cart";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } catch {
      // Storage unavailable (private mode): the cart is simply not remembered.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore: see above.
    }
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((i) => i.productId === item.productId);
      if (!existing) return [...current, item];
      return current.map((i) =>
        i.productId === item.productId ? { ...item, quantity: i.quantity + item.quantity } : i,
      );
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => current.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }, []);

  const remove = useCallback((productIds: string[]) => {
    setItems((current) => current.filter((i) => !productIds.includes(i.productId)));
  }, []);

  const value = useMemo(
    () => ({ items, ready, add, setQuantity, remove }),
    [items, ready, add, setQuantity, remove],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}

export function CartCount() {
  const { items } = useCart();
  if (items.length === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-xs font-semibold text-stone-950">
      {items.length}
    </span>
  );
}
