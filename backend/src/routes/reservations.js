import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

// GET /api/reservations?status=&guestId=&from=&to=
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, guestId, from, to } = req.query
    const where = {}
    if (status)  where.status  = status
    if (guestId) where.guestId = parseInt(guestId)
    if (from || to) {
      where.checkIn = {}
      if (from) where.checkIn.gte = new Date(from)
      if (to)   where.checkIn.lte = new Date(to)
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        guest: { select: { id: true, name: true, email: true } },
        room:  { include: { roomType: true } },
      },
      orderBy: { checkIn: 'desc' },
    })
    res.json(reservations)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/reservations/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: {
        guest:    true,
        room:     { include: { roomType: true } },
        invoices: true,
      },
    })
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    res.json(reservation)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/reservations
router.post('/', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const { guestId, roomId, checkIn, checkOut, adults, children, notes } = req.body
    if (!guestId || !roomId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'guestId, roomId, checkIn, checkOut required' })
    }

    const checkInDate  = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'checkIn must be before checkOut' })
    }

    // No overlapping active reservations for this room
    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId:   parseInt(roomId),
        status:   { in: ['confirmed', 'checked_in'] },
        checkIn:  { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    })
    if (conflict) {
      return res.status(409).json({ error: 'Room not available for selected dates' })
    }

    const reservation = await prisma.reservation.create({
      data: {
        guestId:  parseInt(guestId),
        roomId:   parseInt(roomId),
        checkIn:  checkInDate,
        checkOut: checkOutDate,
        adults:   adults   !== undefined ? parseInt(adults)   : 1,
        children: children !== undefined ? parseInt(children) : 0,
        notes:    notes ?? null,
        status:   'confirmed',
      },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        room:  { include: { roomType: true } },
      },
    })
    res.status(201).json(reservation)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/reservations/:id/check-in
router.post('/:id/check-in', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const reservation = await prisma.reservation.findUnique({ where: { id } })
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    if (reservation.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot check in — status is '${reservation.status}'` })
    }

    const [updated] = await prisma.$transaction([
      prisma.reservation.update({ where: { id }, data: { status: 'checked_in' } }),
      prisma.room.update({ where: { id: reservation.roomId }, data: { status: 'occupied' } }),
    ])
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/reservations/:id/check-out
router.post('/:id/check-out', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const reservation = await prisma.reservation.findUnique({ where: { id } })
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    if (reservation.status !== 'checked_in') {
      return res.status(400).json({ error: `Cannot check out — status is '${reservation.status}'` })
    }

    const paidInvoice = await prisma.invoice.findFirst({
      where: { reservationId: id, status: 'paid' },
    })
    if (!paidInvoice) {
      return res.status(400).json({ error: 'Cannot check out — no paid invoice for this reservation' })
    }

    // Room → cleaning, auto-create housekeeping task
    const [updated] = await prisma.$transaction([
      prisma.reservation.update({ where: { id }, data: { status: 'checked_out' } }),
      prisma.room.update({ where: { id: reservation.roomId }, data: { status: 'cleaning' } }),
      prisma.housekeepingTask.create({
        data: {
          roomId:   reservation.roomId,
          type:     'clean',
          status:   'pending',
          priority: 'normal',
          notes:    'Post checkout clean',
        },
      }),
    ])
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/reservations/:id/cancel
router.post('/:id/cancel', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const reservation = await prisma.reservation.findUnique({ where: { id } })
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    if (reservation.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot cancel — status is '${reservation.status}'` })
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data:  { status: 'cancelled' },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/reservations/:id
router.patch('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { checkIn, checkOut, adults, children, notes } = req.body
    const reservation = await prisma.reservation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(checkIn   !== undefined && { checkIn:  new Date(checkIn) }),
        ...(checkOut  !== undefined && { checkOut: new Date(checkOut) }),
        ...(adults    !== undefined && { adults:   parseInt(adults) }),
        ...(children  !== undefined && { children: parseInt(children) }),
        ...(notes     !== undefined && { notes }),
      },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        room:  { include: { roomType: true } },
      },
    })
    res.json(reservation)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Reservation not found' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
