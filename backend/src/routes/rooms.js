import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

// GET /api/rooms?status=&floor=&type=
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, floor, type } = req.query
    const where = {}
    if (status) where.status = status
    if (floor)  where.floor  = parseInt(floor)
    if (type)   where.roomType = { name: type }

    const rooms = await prisma.room.findMany({
      where,
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    })
    res.json(rooms)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
// Must be before /:id so Express doesn't treat "available" as an id
router.get('/available', authenticate, async (req, res) => {
  try {
    const { check_in, check_out } = req.query
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out required' })
    }

    const checkIn  = new Date(check_in)
    const checkOut = new Date(check_out)
    if (checkIn >= checkOut) {
      return res.status(400).json({ error: 'check_in must be before check_out' })
    }

    const bookedRoomIds = await prisma.reservation.findMany({
      where: {
        status:   { in: ['confirmed', 'checked_in'] },
        checkIn:  { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { roomId: true },
    })

    const rooms = await prisma.room.findMany({
      where: {
        id:     { notIn: bookedRoomIds.map(r => r.roomId) },
        status: { not: 'cleaning' },
      },
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    })
    res.json(rooms)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/types
router.get('/types', authenticate, async (_req, res) => {
  try {
    const types = await prisma.roomType.findMany({ orderBy: { basePrice: 'asc' } })
    res.json(types)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/rooms/types
router.post('/types', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, basePrice, maxOccupancy, amenities } = req.body
    if (!name || !basePrice || !maxOccupancy) {
      return res.status(400).json({ error: 'name, basePrice, maxOccupancy required' })
    }
    const type = await prisma.roomType.create({
      data: {
        name,
        basePrice:    parseFloat(basePrice),
        maxOccupancy: parseInt(maxOccupancy),
        amenities:    amenities ?? null,
      },
    })
    res.status(201).json(type)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Room type name already exists' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: { roomType: true },
    })
    if (!room) return res.status(404).json({ error: 'Room not found' })
    res.json(room)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/rooms
router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { roomNumber, floor, roomTypeId, status } = req.body
    if (!roomNumber || !floor || !roomTypeId) {
      return res.status(400).json({ error: 'roomNumber, floor, roomTypeId required' })
    }
    const room = await prisma.room.create({
      data: {
        roomNumber,
        floor:      parseInt(floor),
        roomTypeId: parseInt(roomTypeId),
        status:     status ?? 'available',
      },
      include: { roomType: true },
    })
    res.status(201).json(room)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Room number already exists' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/rooms/:id/status  — must be before PATCH /:id
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'status required' })
    const room = await prisma.room.update({
      where: { id: parseInt(req.params.id) },
      data:  { status },
    })
    res.json(room)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Room not found' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/rooms/:id
router.patch('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { roomNumber, floor, roomTypeId, status } = req.body
    const room = await prisma.room.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(roomNumber !== undefined && { roomNumber }),
        ...(floor      !== undefined && { floor: parseInt(floor) }),
        ...(roomTypeId !== undefined && { roomTypeId: parseInt(roomTypeId) }),
        ...(status     !== undefined && { status }),
      },
      include: { roomType: true },
    })
    res.json(room)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Room not found' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/rooms/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.room.delete({ where: { id: parseInt(req.params.id) } })
    res.status(204).send()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Room not found' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
