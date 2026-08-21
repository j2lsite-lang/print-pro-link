import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  ok: boolean;
  userId?: string;
  isServiceRole?: boolean;
  status?: number;
  error?: string;
}

function getBearer(req: Request): string | null {
  const header = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") return null;
  return token;
}

/**
 * Verifies the caller is either the service role (internal cron/server calls)
 * or an authenticated user holding the `admin` role in public.user_roles.
 */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  const token = getBearer(req);
  if (!token) return { ok: false, status: 401, error: "Authentication required" };

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  // Internal server-to-server calls (cron jobs) present the service role key.
  if (token === serviceKey) return { ok: true, isServiceRole: true };

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, error: "Authentication required" };

  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roles) return { ok: false, status: 403, error: "Admin access required" };
  return { ok: true, userId: data.user.id };
}

/** Verifies the caller is a signed-in user; returns their id. */
export async function requireUser(req: Request): Promise<AuthResult> {
  const token = getBearer(req);
  if (!token) return { ok: false, status: 401, error: "Authentication required" };

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  if (token === serviceKey) return { ok: true, isServiceRole: true };

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, error: "Authentication required" };
  return { ok: true, userId: data.user.id };
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}
