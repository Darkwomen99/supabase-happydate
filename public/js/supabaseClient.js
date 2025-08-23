// public/js/supabaseClient.js — HappyDate (Supabase client for static HTML pages)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Конфіг підтягуємо з глобального window.ENV (його треба задати в /public/env.js)
const SUPABASE_URL = window.ENV?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[supabaseClient] Brak SUPABASE_URL / SUPABASE_ANON_KEY. Sprawdź public/env.js");
}

// Експортуємо клієнт
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
