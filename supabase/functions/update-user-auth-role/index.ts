import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, isRole, json, preflight, requireAdmin } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  try {
    const access = await requireAdmin(req);
    if (access.error) return access.error;
    const { id, role } = await req.json();
    if (typeof id !== "string" || !id || !isRole(role)) {
      return json({ error: "User ID and valid role are required" }, 400);
    }
    if (id === access.user?.id) return json({ error: "You cannot change your own role" }, 400);

    const { data, error } = await admin.from("profiles")
      .update({ role })
      .eq("id", id)
      .select("id, role")
      .single();
    if (error || !data) return json({ error: "User profile not found" }, 404);
    return json({ user: data });
  } catch (error) {
    console.error("update-user-auth-role failed", error);
    return json({ error: "Could not update role" }, 500);
  }
});
