import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function createUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const nombre = process.argv[4] || 'Admin'

  if (!email || !password) {
    console.error('Usage: npx ts-node scripts/create-user.ts email@example.com password "Nombre Apellido"')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  await pool.query(
    'INSERT INTO crm_users (email, password_hash, nombre) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = $2, nombre = $3',
    [email, hash, nombre]
  )
  console.log(`Usuario creado: ${email}`)
  await pool.end()
}

createUser().catch(console.error)
