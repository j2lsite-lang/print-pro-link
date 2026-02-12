import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CartItem {
  id: string;
  sku: string;
  productName: string;
  options: Record<string, unknown>;
  quantity: number;
  copies: number;
  unitPrice: number | null;
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
}

const CartContext = createContext<CartCtx>({
  items: [],
  itemCount: 0,
  addItem: () => {},
  removeItem: () => {},
  updateItem: () => {},
  clearCart: () => {},
  total: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("j2l-cart");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("j2l-cart", JSON.stringify(newItems));
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const newItem: CartItem = { ...item, id: crypto.randomUUID() };
    persist([...items, newItem]);
  }, [items, persist]);

  const removeItem = useCallback((id: string) => {
    persist(items.filter(i => i.id !== id));
  }, [items, persist]);

  const updateItem = useCallback((id: string, updates: Partial<CartItem>) => {
    persist(items.map(i => i.id === id ? { ...i, ...updates } : i));
  }, [items, persist]);

  const clearCart = useCallback(() => persist([]), [persist]);

  const total = items.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, addItem, removeItem, updateItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
