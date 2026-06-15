import { Router } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

const SAFE_FIELDS = { id: true, name: true, email: true, role: true, shift: true }

// GET /api/staff
router.get('/', authenticate, async (_req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      select:  SAFE_FIELDS,
      orderBy: { name: 'asc' },
    })
    res.json(staff)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/staff/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const member = await prisma.staff.findUnique({
      where:  { id: parseInt(req.params.id) },
      select: SAFE_FIELDS,
    })
    if (!member) return res.status(404).json({ error: 'Staff member not found' })
    res.json(member)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/staff
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, shift } = req.body
    if (!name || !email || !password || !role || !shift) {
      return res.status(400).json({ error: 'name, email, password, role, shift required' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const member = await prisma.staff.create({
      data:   { name, email, password: hashed, role, shift },
      select: SAFE_FIELDS,
    })
    res.status(201).json(member)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already registered' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/staff/:id
router.patch('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, email, password, role, shift } = req.body

    // Only admin can change role
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can change roles' })
    }

    const data = {
      ...(name  !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(role  !== undefined && { role }),
      ...(shift !== undefined && { shift }),
    }
    if (password) data.password = await bcrypt.hash(password, 10)

    const member = await prisma.staff.update({
      where:  { id: parseInt(req.params.id) },
      data,
      select: SAFE_FIELDS,
    })
    res.json(member)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Staff member not found' })
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already registered' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/staff/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }
    await prisma.staff.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Staff member not found' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
