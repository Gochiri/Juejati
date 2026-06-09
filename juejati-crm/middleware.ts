import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

// Instancia separada de NextAuth solo con la config edge-safe (sin pg ni bcrypt).
// Esto evita "edge runtime does not support crypto/pg".
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')

  if (isApiAuth) return NextResponse.next()
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
