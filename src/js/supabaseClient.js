// src/js/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Спочатку пробуємо взяти змінні з env.js (fallback для браузера/статичних сторінок)
let ENV = {};
try {
  // Використовуємо відносний шлях (коректно для білду Next.js)
  ENV = (await import('../api/env.js')).default || {};
} catch {
  // якщо env.js відсутній або SSR-контекст
  ENV = {};
}

// Збираємо ключі Supabase (спочатку з процеса, потім з env.js, потім з window.env)
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ENV.SUPABASE_URL ||
  (typeof window !== 'undefined' && window.env?.SUPABASE_URL);

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ENV.SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' && window.env?.SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[supabaseClient] Missing SUPABASE_URL / SUPABASE_ANON_KEY');
}

// Єдиний екземпляр клієнта
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
