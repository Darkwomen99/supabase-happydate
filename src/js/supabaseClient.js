// /src/js/supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Якщо маєш публічний env-файл, спробуємо його підхопити
let ENV = {};
try {
  // існує у твоєму репо: /src/api/env.js (за структурою)
  ENV = (await import('/src/api/env.js')).default || {};
} catch (_) {}

// fallback на глобальний window.env (можеш визначити у <script> на сторінці)
const SUPABASE_URL = ENV.SUPABASE_URL || (window.env && window.env.SUPABASE_URL);
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY || (window.env && window.env.SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[supabaseClient] Missing SUPABASE_URL / SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
