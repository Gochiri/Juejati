// Edge-safe NextAuth config — sin imports de pg, bcrypt, ni nada que necesite node runtime.
// Se importa desde middleware.ts (edge runtime).
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  // Necesario al correr detrás de un reverse proxy (Traefik en Docker Swarm).
  // Sin esto, NextAuth v5 rechaza la URL con UntrustedHost.
  trustHost: true,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  providers: [], // los providers reales se agregan en auth.ts (node runtime)
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as { id?: string }).id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
