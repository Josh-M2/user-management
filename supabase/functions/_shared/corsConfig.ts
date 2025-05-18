const nodeEnv = Deno.env.get("NODE_ENV")
const urlFE = nodeEnv === "development" 
    ? "null": 
    "http://localhost:5173"

export const corsHeaders = {
  'Access-Control-Allow-Origin': urlFE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};