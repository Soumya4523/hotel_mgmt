import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

// GET /api/housekeeping?status=&roomId=&assignedTo=
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, roomId, assignedTo } = req.query
    const where = {}
    if (status)     where.status     = status
    if (roomId)     where.roomId     = parseInt(roomId)
    if (assignedTo) where.assignedTo = parseInt(assignedTo)

    const tasks = await prisma.housekeepingTask.findMany({
      where,
      include: {
        room:  { select: { id: true, roomNumber: true, floor: true } },
        staff: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })
    res.json(tasks)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/housekeeping/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.housekeepingTask.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: {
        room:  { select: { id: true, roomNumber: true, floor: true } },
        staff: { select: { id: true, name: true, role: true } },
      },
    })
    if (!task) return res.status(404).json({ error: 'Task not found' })
    res.json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/housekeeping
router.post('/', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const { roomId, assignedTo, type, priority, notes } = req.body
    if (!roomId || !type) {
      return res.status(400).json({ error: 'roomId and type required' })
    }

    const task = await prisma.housekeepingTask.create({
      data: {
        roomId:     parseInt(roomId),
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        type,
        priority:   priority ?? 'normal',
        notes:      notes    ?? null,
        status:     'pending',
      },
      include: {
        room:  { select: { id: true, roomNumber: true, floor: true } },
        staff: { select: { id: true, name: true, role: true } },
      },
    })
    res.status(201).json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/housekeeping/:id/status  — before /:id so Express doesn't swallow "status" as id
// Any authenticated staff can update status (housekeeping staff update their own tasks)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'status required' })

    const id   = parseInt(req.params.id)
    const task = await prisma.housekeepingTask.findUnique({ where: { id } })
    if (!task) return res.status(404).json({ error: 'Task not found' })

    const data = { status }
    if (status === 'done') data.completedAt = new Date()

    const updated = await prisma.housekeepingTask.update({ where: { id }, data })

    // Auto-set room to available when a clean task is done
    if (status === 'done' && task.type === 'clean') {
      await prisma.room.update({
        where: { id: task.roomId },
        data:  { status: 'available' },
      })
    }

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/housekeeping/:id
router.patch('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { assignedTo, type, priority, notes } = req.body
    const task = await prisma.housekeepingTask.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(assignedTo !== undefined && { assignedTo: assignedTo ? parseInt(assignedTo) : null }),
        ...(type       !== undefined && { type }),
        ...(priority   !== undefined && { priority }),
        ...(notes      !== undefined && { notes }),
      },
      include: {
        room:  { select: { id: true, roomNumber: true, floor: true } },
        staff: { select: { id: true, name: true, role: true } },
      },
    })
    res.json(task)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Task not found' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
