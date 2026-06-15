import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const router = Router()

const ACCESS_EXPIRY  = '15m'
const REFRESH_EXPIRY = '7d'

function signAccess(staff) {
  return jwt.sign(
    { id: staff.id, email: staff.email, role: staff.role, name: staff.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  )
}

function signRefresh(staff) {
  return jwt.sign(
    { id: staff.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  )
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' })
    }

    const staff = await prisma.staff.findUnique({ where: { email } })
    if (!staff) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, staff.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    res.json({
      accessToken:  signAccess(staff),
      refreshToken: signRefresh(staff),
      user: { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' })

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const staff   = await prisma.staff.findUnique({ where: { id: payload.id } })
    if (!staff) return res.status(401).json({ error: 'User not found' })

    res.json({ accessToken: signAccess(staff) })
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
})

// POST /api/auth/logout  — stateless: client discards tokens
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' })
})

export default router
