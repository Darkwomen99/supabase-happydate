import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Перевірка сесії
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    redirect('/login')
  }

  // 2. Вибірка подій користувача (таблиця "events")
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', session.user.id)
    .order('date', { ascending: true })

  if (eventsError) {
    return <p className="text-red-500">Błąd: {eventsError.message}</p>
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">📅 Moje wydarzenia</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Zalogowano jako: <span className="font-semibold">{session.user.email}</span>
        </p>

        {(!events || events.length === 0) && (
          <p className="text-gray-500">Brak wydarzeń — dodaj pierwsze w kalendarzu!</p>
        )}

        <ul className="space-y-2">
          {events?.map(ev => (
            <li key={ev.id} className="p-3 border rounded-md dark:border-gray-700">
              <strong>{ev.title}</strong>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ev.date}
              </div>
            </li>
          ))}
        </ul>

        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
          >
            Wyloguj się
          </button>
        </form>
      </div>
    </main>
  )
}
