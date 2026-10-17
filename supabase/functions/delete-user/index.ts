import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, json, preflight, requireAdmin } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  try {
    const access = await requireAdmin(req);
    if (access.error) return access.error;
    const { id } = await req.json();
    if (typeof id !== "string" || !id) return json({ error: "User ID is required" }, 400);
    if (id === access.user?.id) return json({ error: "You cannot delete your own account" }, 400);

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 400);
    // The foreign key removes the profile when the Auth user is deleted.
    return json({ ok: true });
  } catch (error) {
    console.error("delete-user failed", error);
    return json({ error: "Could not delete user" }, 500);
  }
});
