// src/lib/supabaseClient.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
// Якщо згенеруєш типи БД: import type { Database } from "@/types/supabase";

// Публічні енви (мають бути задані у Vercel/локально)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!url || !anonKey) {
  throw new Error("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Синглтон клієнта в браузері
let _client: SupabaseClient/*<Database>*/ | null = null;

export function supabaseBrowser(): SupabaseClient/*<Database>*/ {
  if (!_client) {
    _client = createBrowserClient/*<Database>*/(url, anonKey);
  }
  return _client;
}
