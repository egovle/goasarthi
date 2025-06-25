// index.ts
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { name, phone, address } = await req.json();
  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.split('Bearer ')[1];

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    name,
    phone,
    address,
    role: 'customer' // You can adjust this based on context
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ message: 'Profile created' }), {
    status: 200,
  });
});
