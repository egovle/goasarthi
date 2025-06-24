import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("✅ Edge function 'handle-user-signup' is running");

serve(async (req) => {
  try {
    const { record } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const profileData = {
      id: record.id,
      email: record.email,
      role: record.raw_user_meta_data?.role || "customer",
      name: record.raw_user_meta_data?.name || "",
      phone: record.raw_user_meta_data?.phone || "",
      address: record.raw_user_meta_data?.address || "",
      user_id_custom: record.raw_user_meta_data?.user_id_custom || "",
      wallet_balance: 1000,
      is_available: true,
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to insert profile:", result);
      return new Response("Insert failed", { status: 500 });
    }

    return new Response("✅ Profile created successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Function error:", error);
    return new Response("Server error", { status: 500 });
  }
});
