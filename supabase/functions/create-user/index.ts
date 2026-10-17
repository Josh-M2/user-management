import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, isRole, json, preflight, requireAdmin } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  try {
    const access = await requireAdmin(req);
    if (access.error) return access.error;

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = body.password;
    const role = body.role;
    if (!email || typeof password !== "string" || password.length < 6 || !isRole(role)) {
      return json({ error: "Provide an email, a password of at least 6 characters, and a valid role." }, 400);
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) return json({ error: error?.message || "Could not create user" }, 400);

    const { data: newProfile, error: profileError } = await admin.from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();
    if (profileError || !newProfile) {
      await admin.auth.admin.deleteUser(data.user.id);
      console.error("Profile trigger did not create a row", profileError);
      return json({ error: "Could not create a profile. Apply the profiles migration first." }, 500);
    }

    // The auth trigger creates a staff profile. Apply an elevated role only
    // after the authenticated admin has chosen it.
    if (role !== "staff") {
      const { error: roleError } = await admin.from("profiles")
        .update({ role })
        .eq("id", data.user.id)
        .select("id")
        .single();
      if (roleError) {
        await admin.auth.admin.deleteUser(data.user.id);
        console.error("Could not set role", roleError);
        return json({ error: "Could not set the new user's role. Check the profiles migration." }, 500);
      }
    }

    return json({ user: { id: data.user.id, email: data.user.email, role } }, 201);
  } catch (error) {
    console.error("create-user failed", error);
    return json({ error: "Could not create user" }, 500);
  }
});
