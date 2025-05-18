// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.


import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info('server started');

const ANON_KEY = Deno.env.get("VITE_SUPABASE_API_KEY");
const URL = Deno.env.get("VITE_SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("VITE_SUPABASE_SERVICE_KEY");

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  console.info("SERVICE_ROLE_KEY: ", SERVICE_ROLE_KEY);
  console.info("ANON_KEY: ", ANON_KEY);
  console.info("URL: ", URL);
  try {
    const { id, role } = await req.json();
    if (!id || !role) {
      return new Response(JSON.stringify({
        error: "Missing 'id' or 'role'"
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Update user's metadata in auth.users
    const res = await fetch(`${URL}/auth/v1/admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        user_metadata: {
          role
        },
        app_metadata: {
          role
        }
      })
    });
    if (res) {
      console.info("res: ", res);
    }
    const data = {
      message: `User ${id} updated with role '${role}'`
    };
    console.info(data);
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({
      error: "Invalid request or internal error"
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-user-auth-role' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
