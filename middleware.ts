// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseForMiddleware } from '@/lib/supabaseClients'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = supabaseForMiddleware({ req, res })
  await supabase.auth.getSession() // оновлює куки при рефреші токена
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
}
