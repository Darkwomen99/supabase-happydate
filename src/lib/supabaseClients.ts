// src/lib/supabaseClients.ts
import {
  createClientComponentClient,
  createServerComponentClient,
  createRouteHandlerClient,
  createMiddlewareClient,
} from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

// Якщо матимеш типи БД, пізніше додаси <Database> до викликів вище.

export const supabaseBrowser = () =>
  createClientComponentClient()

export const supabaseServer = () =>
  createServerComponentClient({ cookies })

export const supabaseRoute = () =>
  createRouteHandlerClient({ cookies })

export const supabaseForMiddleware = (opts: { req: NextRequest; res: NextResponse }) =>
  createMiddlewareClient(opts)
