import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'lesead-secret-key-change-in-prod'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
})

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

initDb().catch(console.error)

router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' })

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const id = `u-${Date.now()}`
    await pool.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [id, email.toLowerCase(), passwordHash]
    )
    const token = jwt.sign({ id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ user: { id, email: email.toLowerCase() }, token })
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'That email is already in use.' })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' })

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'Email or password is incorrect.' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Email or password is incorrect.' })

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ user: { id: user.id, email: user.email }, token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

export default router
