// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {corsHeaders} from "../_shared/corsConfig.ts" 
import {supabase} from "../_shared/supabaseClient.ts";

console.log("delete user function started");

Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
 
  try {
    const { id } = await req.json();
    if (!id ) {
      return new Response(JSON.stringify({
        error: "Missing id",
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

   const {data, error} = await supabase.auth.admin.deleteUser(id);

 
    if(error) {
      return new Response(JSON.stringify(error), {
      headers: corsHeaders
    });
  }

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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/delete-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
