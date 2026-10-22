import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "./useCart";
import type { ShippingAddress, ShippingChoice } from "@/lib/shipping";
export function useShipping(items: CartItem[], address: ShippingAddress, method: string) {
  const [result, setResult] = useState<{ key: string; shippingHt: number | null; choices: ShippingChoice[]; selectedMethod: string | null }>();
  const key = JSON.stringify({ items: items.map(i => ({ sku: i.sku, quantity: i.quantity, copies: i.copies, configuration: i.configuration })), address, method });
  const ready = items.length > 0 && !!address.postalCode && !!address.city;
  useEffect(() => {
    let current = true;
    if (!ready) return;
    const timer = setTimeout(async () => {
      try {
        const body = JSON.parse(key);
        if (!body.method) delete body.method;
        const { data, error } = await supabase.functions.invoke("cart-shipping", { body });
        if (current) setResult({ key, shippingHt: error ? null : data?.shippingHt ?? null, choices: error ? [] : data?.choices ?? [], selectedMethod: error ? null : data?.selectedMethod ?? null });
      } catch { if (current) setResult({ key, shippingHt: null, choices: [], selectedMethod: null }); }
    }, 500);
    return () => { current = false; clearTimeout(timer); };
  }, [key, ready]);
  return { shippingHt: ready && result?.key === key ? result.shippingHt : null, choices: result?.key === key ? result.choices : [], selectedMethod: result?.key === key ? result.selectedMethod : null, loading: ready && result?.key !== key };
}