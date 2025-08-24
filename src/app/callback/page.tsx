// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // обмінюємо ?code=... на сесію
      await supabase.auth.exchangeCodeForSession(window.location.href);
      router.replace("/dashboard"); // або куди потрібно
    })();
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center">
      <p>Kończymy logowanie…</p>
    </main>
  );
}
