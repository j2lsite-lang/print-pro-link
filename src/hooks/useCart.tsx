import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { currentCartPrice } from "@/lib/cart-pricing";
import type { ShippingAddress } from "@/lib/shipping";

export interface CartItem {
  id: string;
  sku: string;
  productName: string;
  options: Record<string, unknown>;
  quantity: number;
  copies: number;
  unitPrice: number | null;
  supplierPriceHT?: number;
  includeDesignFee?: boolean;
  configuration?: Record<string, unknown>;
  currency: string;
  fileUrl: string | null;
  originalFileName: string | null;
}

interface CartCtx {
  items: CartItem[];
  itemCount: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  total: number;
  deliveryAddress: ShippingAddress;
  setDeliveryAddress: (address: ShippingAddress) => void;
  shippingMethod: string;
  setShippingMethod: (method: string) => void;
}

const CartContext = createContext<CartCtx>({
  items: [],
  itemCount: 0,
  addItem: () => {},
  removeItem: () => {},
  updateItem: () => {},
  clearCart: () => {},
  total: 0,
  deliveryAddress: { country: "FR" },
  setDeliveryAddress: () => {},
  shippingMethod: "",
  setShippingMethod: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [deliveryAddress, setAddress] = useState<ShippingAddress>(() => {
    try { return JSON.parse(sessionStorage.getItem("j2l-delivery-address") || '{"country":"FR"}'); }
    catch { return { country: "FR" }; }
  });
  const [shippingMethod, setMethod] = useState(() => sessionStorage.getItem("j2l-shipping-method") || "");
  const setDeliveryAddress = (address: ShippingAddress) => {
    setAddress(address);
    setMethod("");
    sessionStorage.removeItem("j2l-shipping-method");
    sessionStorage.setItem("j2l-delivery-address", JSON.stringify(address));
  };
  const setShippingMethod = (method: string) => {
    setMethod(method);
    sessionStorage.setItem("j2l-shipping-method", method);
  };
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("j2l-cart");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.map((item: CartItem) => ({ ...item, unitPrice: currentCartPrice(item) })) : [];
    } catch { return []; }
  });

  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("j2l-cart", JSON.stringify(newItems));
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const newItem: CartItem = { ...item, unitPrice: currentCartPrice(item), id: crypto.randomUUID() };
    persist([...items, newItem]);
  }, [items, persist]);

  const removeItem = useCallback((id: string) => {
    persist(items.filter(i => i.id !== id));
  }, [items, persist]);

  const updateItem = useCallback((id: string, updates: Partial<CartItem>) => {
    persist(items.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, ...updates };
      return { ...updated, unitPrice: currentCartPrice(updated) };
    }));
  }, [items, persist]);

  const clearCart = useCallback(() => persist([]), [persist]);

  const total = items.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, addItem, removeItem, updateItem, clearCart, total, deliveryAddress, setDeliveryAddress, shippingMethod, setShippingMethod }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
