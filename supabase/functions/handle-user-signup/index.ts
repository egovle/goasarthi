// supabase/functions/handle-user-signup/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  const { record } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Assign default role and custom ID
  const role = "customer"; // or "vle" if you want different logic
  const user_id_custom = `${role.toUpperCase()}${Date.now().toString().slice(-4)}`;

  const { error } = await supabase.from("profiles").insert({
    id: record.id,
    email: record.email,
    name: record.user_metadata.name,
    address: record.user_metadata.address,
    phone: record.user_metadata.phone,
    role,
    user_id_custom,
    wallet_balance: 1000,
    is_available: true,
  });

  if (error) {
    console.error("Error inserting profile:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
