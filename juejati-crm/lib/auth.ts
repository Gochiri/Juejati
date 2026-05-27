import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import pool from './db'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const result = await pool.query(
            'SELECT id, email, nombre, password_hash FROM crm_users WHERE email = $1 AND activo = true',
            [credentials.email]
          )
          const user = result.rows[0]
          if (!user) return null
          const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
          if (!valid) return null
          return { id: user.id, email: user.email, name: user.nombre }
        } catch (err) {
          console.error('[auth] authorize error:', err)
          return null
        }
      },
    }),
  ],
})
