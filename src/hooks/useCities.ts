import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface City {
  slug: string;
  name: string;
  region: string;
  cp: string;
  department: string | null;
}

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("slug, name, region, cp, department")
        .order("name");
      if (error) throw error;
      return data as City[];
    },
    staleTime: 1000 * 60 * 60, // 1h cache
  });
}

export function useCity(slug: string | undefined) {
  return useQuery({
    queryKey: ["city", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("cities")
        .select("slug, name, region, cp, department")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as City | null;
    },
    enabled: !!slug,
  });
}
