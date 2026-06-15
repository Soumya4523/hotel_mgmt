import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()
const TAX_RATE = 0.10

// GET /api/invoices?status=&reservationId=
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, reservationId } = req.query
    const where = {}
    if (status)        where.status        = status
    if (reservationId) where.reservationId = parseInt(reservationId)

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        reservation: {
          include: { guest: { select: { id: true, name: true, email: true } }, room: true },
        },
        payments: true,
      },
      orderBy: { issuedAt: 'desc' },
    })
    res.json(invoices)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: {
        reservation: {
          include: { guest: true, room: { include: { roomType: true } } },
        },
        payments: true,
      },
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json(invoice)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/invoices — generate from reservation
router.post('/', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const { reservationId, discountAmount } = req.body
    if (!reservationId) return res.status(400).json({ error: 'reservationId required' })

    const reservation = await prisma.reservation.findUnique({
      where:   { id: parseInt(reservationId) },
      include: { room: { include: { roomType: true } } },
    })
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot invoice a cancelled reservation' })
    }

    const existing = await prisma.invoice.findFirst({
      where: { reservationId: parseInt(reservationId), status: { not: 'void' } },
    })
    if (existing) return res.status(409).json({ error: 'Non-void invoice already exists for this reservation' })

    const nights   = Math.ceil(
      (new Date(reservation.checkOut) - new Date(reservation.checkIn)) / (1000 * 60 * 60 * 24)
    )
    const subtotal = parseFloat(reservation.room.roomType.basePrice) * nights
    const discount = discountAmount ? parseFloat(discountAmount) : 0
    const tax      = parseFloat(((subtotal - discount) * TAX_RATE).toFixed(2))
    const total    = parseFloat((subtotal - discount + tax).toFixed(2))

    const invoice = await prisma.invoice.create({
      data: {
        reservationId: parseInt(reservationId),
        subtotal,
        discount,
        tax,
        total,
        status:   'issued',
        issuedAt: new Date(),
      },
      include: {
        reservation: {
          include: { guest: { select: { id: true, name: true, email: true } }, room: true },
        },
      },
    })
    res.status(201).json(invoice)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/invoices/:id/void
router.patch('/:id/void', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    if (invoice.status === 'paid') return res.status(400).json({ error: 'Cannot void a paid invoice' })
    if (invoice.status === 'void') return res.status(400).json({ error: 'Invoice already voided' })

    const updated = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data:  { status: 'void' },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/invoices/:id/payments
router.get('/:id/payments', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where:   { invoiceId: parseInt(req.params.id) },
      orderBy: { paidAt: 'desc' },
    })
    res.json(payments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/invoices/:id/payments — record payment, auto-mark paid when total covered
router.post('/:id/payments', authenticate, requireRole('admin', 'manager', 'front_desk'), async (req, res) => {
  try {
    const { amount, method } = req.body
    if (!amount || !method) return res.status(400).json({ error: 'amount and method required' })

    const invoiceId = parseInt(req.params.id)
    const invoice   = await prisma.invoice.findUnique({
      where:   { id: invoiceId },
      include: { payments: true },
    })
    if (!invoice)               return res.status(404).json({ error: 'Invoice not found' })
    if (invoice.status === 'void')  return res.status(400).json({ error: 'Cannot pay a voided invoice' })
    if (invoice.status === 'paid')  return res.status(400).json({ error: 'Invoice already fully paid' })

    const alreadyPaid  = invoice.payments.reduce((s, p) => s + parseFloat(p.amount), 0)
    const newTotal     = alreadyPaid + parseFloat(amount)
    const invoiceTotal = parseFloat(invoice.total)

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: { invoiceId, amount: parseFloat(amount), method },
      }),
      ...(newTotal >= invoiceTotal
        ? [prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'paid' } })]
        : []),
    ])
    res.status(201).json(payment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
