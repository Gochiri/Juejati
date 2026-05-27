import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

// Carga manual de .env.local (sin dependencia de dotenv)
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no esta definido en .env.local')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase.co') ? { rejectUnauthorized: false } : false,
})

async function createUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const nombre = process.argv[4] || 'Admin'

  if (!email || !password) {
    console.error('Uso: npx tsx scripts/create-user.ts email@example.com password "Nombre Apellido"')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  await pool.query(
    `INSERT INTO crm_users (email, password_hash, nombre)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = $2, nombre = $3, activo = true`,
    [email, hash, nombre]
  )
  console.log(`Usuario creado: ${email}`)
  await pool.end()
}

createUser().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
