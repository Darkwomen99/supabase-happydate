// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createBrowserClientSafe = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
