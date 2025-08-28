// /public/env.js
// Завантажується в браузері ДО supabaseClient.js

;(() => {
  const ENV = {
    APP_VERSION: "1.0.0", // опційно: для cache-busting перекладів тощо
    SUPABASE_URL: "https://luxkdftbmxspkjscdafn.supabase.co",
    SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eGtkZnRibXhzcGtqc2NkYWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzgyMzQsImV4cCI6MjA3MTcxNDIzNH0.eRny9_e-UKjZGQjSNxNnzFiMClgiyTTi-H-qucSXVZo",
  };

  // Сучасний простір імен
  window.ENV = Object.freeze({ ...(window.ENV || {}), ...ENV });

  // Legacy-аліас (якщо десь читається window.env)
  window.env = Object.freeze({ ...(window.env || {}), ...ENV });

  // Додаткові глобали для дуже старого коду
  window.SUPABASE_URL = window.ENV.SUPABASE_URL;
  window.SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY;
})();
