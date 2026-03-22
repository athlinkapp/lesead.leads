import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const router = Router()

const USERS_FILE = path.join('/tmp', 'lesead-users.json')
const JWT_SECRET = process.env.JWT_SECRET ?? 'lesead-secret-key-change-in-prod'

interface User {
  id: string
  email: string
  passwordHash: string
}

function loadUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

function saveUsers(users: User[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' })

  const users = loadUsers()
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'That email is already in use.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user: User = { id: `u-${Date.now()}`, email: email.toLowerCase(), passwordHash }
  users.push(user)
  saveUsers(users)

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ user: { id: user.id, email: user.email }, token })
})

router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' })

  const users = loadUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return res.status(401).json({ error: 'Email or password is incorrect.' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Email or password is incorrect.' })

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ user: { id: user.id, email: user.email }, token })
})

export default router
