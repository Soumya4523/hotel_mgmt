import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter         from './routes/auth.js'
import roomsRouter        from './routes/rooms.js'
import reservationsRouter from './routes/reservations.js'
import guestsRouter       from './routes/guests.js'
import staffRouter        from './routes/staff.js'
import housekeepingRouter from './routes/housekeeping.js'
import billingRouter      from './routes/billing.js'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth',         authRouter)
app.use('/api/rooms',        roomsRouter)
app.use('/api/reservations', reservationsRouter)
app.use('/api/guests',       guestsRouter)
app.use('/api/staff',        staffRouter)
app.use('/api/housekeeping', housekeepingRouter)
app.use('/api/invoices',     billingRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
