// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Використай публічні ключі з .env.local
// NEXT_PUBLIC_SUPABASE_URL=...
// NEXT_PUBLIC_SUPABASE_ANON_KEY=...
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  // Не падаємо, але підкажемо в консолі
  // У продакшні варто мати ці змінні завжди
  console.warn(
    "[supabaseClient] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url || "", anon || "", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
