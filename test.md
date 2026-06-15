# Hotel Management System — Test Instructions

---

## Frontend (wired to real API)

**Prerequisites:** backend running on port 4000, DB seeded.

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

**Login**
- Redirected to `/login` automatically (not logged in)
- Enter `admin@hotel.com` / `admin123` → lands on Dashboard
- Logout button (arrow icon) in bottom-left of sidebar

**Dashboard**
- Stats pull from real API: rooms, reservations, housekeeping tasks, paid invoices
- Arrivals/departures show reservations for today's date
- Room progress bars reflect live DB state

**Rooms**
- Cards populated from `/api/rooms` with real room types and prices
- Status dropdown on each card → PATCH `/api/rooms/:id/status` live

**Reservations**
- Table populated from `/api/reservations`
- "Check In" → POST `/api/reservations/:id/check-in` → row updates to checked_in
- "Check Out" → POST `/api/reservations/:id/check-out` → row updates to checked_out
- "Cancel" → POST `/api/reservations/:id/cancel` → row updates to cancelled
- Status filter refetches from API

**Guests**
- Table from `/api/guests`, client-side search by name/email

**Housekeeping**
- Kanban columns from `/api/housekeeping` (all tasks)
- "Start" button (pending → in_progress) → PATCH status
- "Mark Done" (in_progress → done) → PATCH status, auto-sets room available

**Billing**
- Invoices from `/api/invoices`
- "Mark Paid" → POST `/api/invoices/:id/payments` with remaining amount
- "Void" → PATCH `/api/invoices/:id/void` (confirm dialog)

**Staff**
- Table from `/api/staff`
- "Remove" → DELETE `/api/staff/:id` (confirm dialog, blocked if self)

---

## Backend — Auth

**Seed admin user**
```bash
cd backend
npm install
npm run seed
```
Expected: `Admin seeded: admin@hotel.com / admin123`

**Start server**
```bash
npm run dev
```
Expected: `Server running on http://localhost:4000`

**Health check**
```bash
curl http://localhost:4000/health
```
Expected: `{"status":"ok","timestamp":"..."}`

**Login**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"admin123"}'
```
Expected: JSON with `accessToken`, `refreshToken`, `user`

**Bad credentials → 401**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"wrong"}'
```
Expected: `{"error":"Invalid credentials"}`

**Refresh token**
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"PASTE_REFRESH_TOKEN"}'
```
Expected: `{"accessToken":"..."}`

---

## Backend — Rooms

**Grab token (run once per session)**
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
echo $TOKEN
```

**Create room type**
```bash
curl -s -X POST http://localhost:4000/api/rooms/types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Deluxe","basePrice":149,"maxOccupancy":2}'
```
Expected: `{"id":1,"name":"Deluxe","basePrice":"149",...}`

**Create a room**
```bash
curl -s -X POST http://localhost:4000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"roomNumber":"101","floor":1,"roomTypeId":1}'
```
Expected: `{"id":1,"roomNumber":"101","status":"available",...}`

**List all rooms**
```bash
curl -s http://localhost:4000/api/rooms \
  -H "Authorization: Bearer $TOKEN"
```

**Filter by status**
```bash
curl -s "http://localhost:4000/api/rooms?status=available" \
  -H "Authorization: Bearer $TOKEN"
```

**Quick status update**
```bash
curl -s -X PATCH http://localhost:4000/api/rooms/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"cleaning"}'
```

**Check availability**
```bash
curl -s "http://localhost:4000/api/rooms/available?check_in=2026-07-01&check_out=2026-07-05" \
  -H "Authorization: Bearer $TOKEN"
```

**No token → 401**
```bash
curl -s http://localhost:4000/api/rooms
```
Expected: `{"error":"Missing or invalid Authorization header"}`

---

## Backend — Guests

**Create guest**
```bash
curl -s -X POST http://localhost:4000/api/guests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"James Wilson","email":"james@email.com","phone":"+1 555-0101","idNumber":"P8823401"}'
```
Expected: `{"id":1,"name":"James Wilson","email":"james@email.com",...}`

**Create second guest**
```bash
curl -s -X POST http://localhost:4000/api/guests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Sarah Chen","email":"sarah@email.com","phone":"+1 555-0102"}'
```

**List all guests**
```bash
curl -s http://localhost:4000/api/guests \
  -H "Authorization: Bearer $TOKEN"
```

**Search by name**
```bash
curl -s "http://localhost:4000/api/guests?search=sarah" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: only Sarah Chen

**Get single guest**
```bash
curl -s http://localhost:4000/api/guests/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Update loyalty points**
```bash
curl -s -X PATCH http://localhost:4000/api/guests/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"loyaltyPoints":500}'
```
Expected: guest with `loyaltyPoints: 500`

**Duplicate email → 409**
```bash
curl -s -X POST http://localhost:4000/api/guests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Fake","email":"james@email.com"}'
```
Expected: `{"error":"Email already registered"}`

**Guest reservations (empty)**
```bash
curl -s http://localhost:4000/api/guests/1/reservations \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `[]`

---

## Backend — Reservations

> Prereqs: room 101 (id:1) and guests James (id:1), Sarah (id:2) exist from earlier steps.
> Reset room 101 status to available first if needed:
> `curl -s -X PATCH http://localhost:4000/api/rooms/1/status -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"status":"available"}'`

**Create reservation**
```bash
curl -s -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"guestId":1,"roomId":1,"checkIn":"2026-07-10","checkOut":"2026-07-13","adults":2}'
```
Expected: `{"id":1,"status":"confirmed",...}`

**Conflict — same room overlapping dates → 409**
```bash
curl -s -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"guestId":2,"roomId":1,"checkIn":"2026-07-11","checkOut":"2026-07-14","adults":1}'
```
Expected: `{"error":"Room not available for selected dates"}`

**List all reservations**
```bash
curl -s http://localhost:4000/api/reservations \
  -H "Authorization: Bearer $TOKEN"
```

**Filter by status**
```bash
curl -s "http://localhost:4000/api/reservations?status=confirmed" \
  -H "Authorization: Bearer $TOKEN"
```

**Check in**
```bash
curl -s -X POST http://localhost:4000/api/reservations/1/check-in \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":"checked_in",...}`
Room 101 status should now be `occupied`.

**Check in again → 400**
```bash
curl -s -X POST http://localhost:4000/api/reservations/1/check-in \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"error":"Cannot check in — status is 'checked_in'"}`

**Check out**
```bash
curl -s -X POST http://localhost:4000/api/reservations/1/check-out \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":"checked_out",...}`
Room 101 status → `cleaning`. A housekeeping task auto-created.

**Verify room is cleaning**
```bash
curl -s http://localhost:4000/api/rooms/1 \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":"cleaning",...}`

**Create another reservation to test cancel**
```bash
curl -s -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"guestId":2,"roomId":1,"checkIn":"2026-08-01","checkOut":"2026-08-03","adults":1}'
```

**Cancel**
```bash
curl -s -X POST http://localhost:4000/api/reservations/2/cancel \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":"cancelled",...}`

**Guest reservation history**
```bash
curl -s http://localhost:4000/api/guests/1/reservations \
  -H "Authorization: Bearer $TOKEN"
```
Expected: array with 1 reservation (the checked-out one)

---

## Backend — Housekeeping

> Prereq: room 101 (id:1) should be in `cleaning` status from the check-out step.
> A housekeeping task (id:1) was auto-created during check-out.

**List all tasks**
```bash
curl -s http://localhost:4000/api/housekeeping \
  -H "Authorization: Bearer $TOKEN"
```
Expected: array with 1 task (auto-created on checkout), status `pending`, type `clean`

**Filter by status**
```bash
curl -s "http://localhost:4000/api/housekeeping?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

**Create a manual task**
```bash
curl -s -X POST http://localhost:4000/api/housekeeping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"roomId":1,"type":"restock","priority":"low","notes":"Mini bar restock"}'
```
Expected: `{"id":2,"type":"restock","status":"pending","priority":"low",...}`

**Get single task**
```bash
curl -s http://localhost:4000/api/housekeeping/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Update status to in_progress**
```bash
curl -s -X PATCH http://localhost:4000/api/housekeeping/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"in_progress"}'
```
Expected: `{"status":"in_progress",...}`

**Mark done — auto-sets room to available**
```bash
curl -s -X PATCH http://localhost:4000/api/housekeeping/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"done"}'
```
Expected: `{"status":"done","completedAt":"...",...}`

**Verify room is now available**
```bash
curl -s http://localhost:4000/api/rooms/1 \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":"available",...}`

**Assign task to staff (need staff id — use 1 for admin)**
```bash
curl -s -X PATCH http://localhost:4000/api/housekeeping/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"assignedTo":1,"priority":"urgent"}'
```
Expected: task with `assignedTo` populated with staff name

**Filter by room**
```bash
curl -s "http://localhost:4000/api/housekeeping?roomId=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Backend — Billing

> Prereq: reservation id:1 (James Wilson, room 101) exists and is `checked_out` from earlier steps.

**Generate invoice from reservation**
```bash
curl -s -X POST http://localhost:4000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reservationId":1}'
```
Expected: `{"id":1,"status":"issued","subtotal":...,"tax":...,"total":...}`
Tax is auto-calculated at 10% of subtotal. Nights × base price = subtotal.

**Duplicate invoice → 409**
```bash
curl -s -X POST http://localhost:4000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reservationId":1}'
```
Expected: `{"error":"Non-void invoice already exists for this reservation"}`

**List all invoices**
```bash
curl -s http://localhost:4000/api/invoices \
  -H "Authorization: Bearer $TOKEN"
```

**Get single invoice**
```bash
curl -s http://localhost:4000/api/invoices/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Record partial payment**
```bash
curl -s -X POST http://localhost:4000/api/invoices/1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":100,"method":"cash"}'
```
Expected: payment created, invoice still `issued` (not fully covered)

**List payments**
```bash
curl -s http://localhost:4000/api/invoices/1/payments \
  -H "Authorization: Bearer $TOKEN"
```

**Pay remaining — auto-marks invoice paid**
```bash
# Get total from invoice first, then pay the rest
curl -s -X POST http://localhost:4000/api/invoices/1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":9999,"method":"card"}'
```
Expected: payment created, invoice status auto-flips to `paid`

**Verify invoice is paid**
```bash
curl -s http://localhost:4000/api/invoices/1 \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":"paid",...}`

**Pay again → 400**
```bash
curl -s -X POST http://localhost:4000/api/invoices/1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":50,"method":"cash"}'
```
Expected: `{"error":"Invoice already fully paid"}`

**Void a different invoice (create one first)**
```bash
curl -s -X POST http://localhost:4000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reservationId":2}'

curl -s -X PATCH http://localhost:4000/api/invoices/2/void \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":"void",...}`

---

## Backend — Staff

**List all staff**
```bash
curl -s http://localhost:4000/api/staff \
  -H "Authorization: Bearer $TOKEN"
```
Expected: array with 1 member (admin seeded earlier). Password never returned.

**Get single staff member**
```bash
curl -s http://localhost:4000/api/staff/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Create staff member**
```bash
curl -s -X POST http://localhost:4000/api/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Marco Silva","email":"m.silva@hotel.com","password":"pass123","role":"housekeeping","shift":"morning"}'
```
Expected: `{"id":2,"name":"Marco Silva","role":"housekeeping",...}` — no password field

**Duplicate email → 409**
```bash
curl -s -X POST http://localhost:4000/api/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Fake","email":"m.silva@hotel.com","password":"x","role":"front_desk","shift":"evening"}'
```
Expected: `{"error":"Email already registered"}`

**Update shift**
```bash
curl -s -X PATCH http://localhost:4000/api/staff/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"shift":"evening"}'
```
Expected: staff with `shift: "evening"`

**Delete staff member**
```bash
curl -s -X DELETE http://localhost:4000/api/staff/2 \
  -H "Authorization: Bearer $TOKEN"
```
Expected: 204 No Content

**Delete self → 400**
```bash
curl -s -X DELETE http://localhost:4000/api/staff/1 \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"error":"Cannot delete your own account"}`
