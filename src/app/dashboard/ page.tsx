// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        // якщо немає користувача → редірект на логін
        router.replace("/login");
      } else {
        setEmail(user.email ?? null);
      }
      setLoading(false);
    }
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p>Ładowanie...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-white dark:bg-gray-900">
      <div className="p-6 rounded-xl bg-gray-100 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Moje wydarzenia</h1>
        <p className="mt-2">Zalogowano jako: {email || "Nieznany"}</p>
        <button
          className="mt-4 px-4 py-2 rounded bg-gray-900 text-white"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          Wyloguj
        </button>
      </div>
    </main>
  );
}
