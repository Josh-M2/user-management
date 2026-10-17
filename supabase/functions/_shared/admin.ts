import { createClient } from "@supabase/supabase-js";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

export function preflight(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  return null;
}

function serviceKey() {
  const newKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (newKeys) {
    const defaultKey = JSON.parse(newKeys).default;
    if (defaultKey) return defaultKey;
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

const url = Deno.env.get("SUPABASE_URL");
const key = serviceKey();
if (!url || !key) throw new Error("Supabase function environment is incomplete");

export const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function requireAdmin(req: Request) {
  const match = /^Bearer (.+)$/i.exec(req.headers.get("Authorization") || "");
  if (!match) return { error: json({ error: "Sign in required" }, 401) };

  const { data, error } = await admin.auth.getUser(match[1]);
  if (error || !data.user) return { error: json({ error: "Session expired. Sign in again." }, 401) };

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    return { error: json({ error: "Admin access required" }, 403) };
  }
  return { user: data.user };
}

export function isRole(value: unknown): value is "admin" | "manager" | "staff" {
  return value === "admin" || value === "manager" || value === "staff";
}
