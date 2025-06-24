// supabase/functions/handle-user-signup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Edge function 'handle-user-signup' is running");

serve(async (req) => {
  try {
    const payload = await req.json();

    const { record } = payload;

    const profileData = {
      id: record.id,
      email: record.email,
      role: record.raw_user_meta_data?.role || 'customer',
      name: record.raw_user_meta_data?.name || '',
      phone: record.raw_user_meta_data?.phone || '',
      address: record.raw_user_meta_data?.address || '',
      user_id_custom: record.raw_user_meta_data?.user_id_custom || '',
      wallet_balance: 1000,
      is_available: true,
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const insertResp = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(profileData),
    });

    const insertJson = await insertResp.json();

    if (!insertResp.ok) {
      console.error("Failed to insert into profiles:", insertJson);
      return new Response("Insert failed", { status: 500 });
    }

    return new Response("User profile created!", { status: 200 });
  } catch (err) {
    console.error("Function error:", err);
    return new Response("Server error", { status: 500 });
  }
});
