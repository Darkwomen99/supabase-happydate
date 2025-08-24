// src/app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClients";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Logowanie trwa…");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDesc = url.searchParams.get("error_description");

        if (errorDesc) {
          setMsg(decodeURIComponent(errorDesc));
          return;
        }
        if (!code) {
          setMsg("Brak kodu autoryzacyjnego w URL.");
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        // ✅ У твоїй версії SDK — рядок
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg(error.message);
          return;
        }

        router.replace("/dashboard");
      } catch (e: any) {
        setMsg(e?.message || "Wystąpił błąd podczas logowania.");
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <p>{msg}</p>
    </main>
  );
}
