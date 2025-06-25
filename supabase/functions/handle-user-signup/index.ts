// /handle-user-signup/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  try {
    const { user } = await req.json()

    // Extract custom fields from metadata (passed during signup)
    const full_name = user.user_metadata.full_name || ''
    const mobile = user.user_metadata.mobile || ''
    const location = user.user_metadata.location || ''

    // Call Supabase Admin API to insert into `customers` table
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const response = await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify([
        {
          id: user.id,
          email: user.email,
          full_name,
          mobile,
          location,
          created_at: new Date().toISOString()
        },
      ]),
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(`Database insert failed: ${error}`, { status: 500 })
    }

    return new Response('User saved to customers table', { status: 200 })
  } catch (error) {
    return new Response(`Server Error: ${error.message}`, { status: 500 })
  }
})
