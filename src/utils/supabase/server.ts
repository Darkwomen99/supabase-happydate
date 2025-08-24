import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const createClient = async () => {
  const cookieStore = await cookies() // у твоїй збірці cookies() async — тож await
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
