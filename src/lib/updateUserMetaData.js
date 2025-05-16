import { supabaseAdmin } from "../supabaseAdmin";

export const updateUserMetaData = async (id, role) => {
  await supabaseAdmin.auth.admin.updateUserById(id, {
    app_metadata: {
      role: role,
    },
  });
};
