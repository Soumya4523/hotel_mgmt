import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

// GET /api/guests?search=
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query
    const where = search
      ? {
          OR: [
            { name:  { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    const guests = await prisma.guest.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    res.json(guests)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/guests/:id/reservations  — must be before /:id
router.get('/:id/reservations', authenticate, async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where:   { guestId: parseInt(req.params.id) },
      include: { room: { include: { roomType: true } } },
      orderBy: { checkIn: 'desc' },
    })
    res.json(reservations)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/guests/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: parseInt(req.params.id) },
    })
    if (!guest) return res.status(404).json({ error: 'Guest not found' })
    res.json(guest)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/guests
router.post('/', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const { name, email, phone, idNumber, preferences } = req.body
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email required' })
    }
    const guest = await prisma.guest.create({
      data: {
        name,
        email,
        phone:       phone       ?? null,
        idNumber:    idNumber    ?? null,
        preferences: preferences ?? null,
      },
    })
    res.status(201).json(guest)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already registered' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/guests/:id
router.patch('/:id', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const { name, email, phone, idNumber, loyaltyPoints, preferences } = req.body
    const guest = await prisma.guest.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name          !== undefined && { name }),
        ...(email         !== undefined && { email }),
        ...(phone         !== undefined && { phone }),
        ...(idNumber      !== undefined && { idNumber }),
        ...(loyaltyPoints !== undefined && { loyaltyPoints: parseInt(loyaltyPoints) }),
        ...(preferences   !== undefined && { preferences }),
      },
    })
    res.json(guest)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Guest not found' })
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already registered' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
