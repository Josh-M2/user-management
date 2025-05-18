import {createClient} from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("VITE_SUPABASE_SERVICE_KEY");

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
