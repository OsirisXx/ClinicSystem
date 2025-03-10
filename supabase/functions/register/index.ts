import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RegisterRequest {
  email: string
  password: string
  fullName: string
  role: 'patient' | 'doctor'
}

serve(async (req) => {
  try {
    const { email, password, fullName, role } = await req.json() as RegisterRequest

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    })

    if (authError) throw authError

    // 2. Create the user profile in the respective table
    const { error: profileError } = await supabaseAdmin
      .from(role === 'patient' ? 'patients' : 'doctors')
      .insert([
        {
          user_id: authData.user.id,
          full_name: fullName,
        },
      ])

    if (profileError) {
      // Cleanup: Delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return new Response(
      JSON.stringify({ message: 'Registration successful' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 