# Hotel Management System

## Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Node.js + Express                 |
| Frontend | React + React Router + TailwindCSS|
| Database | PostgreSQL via Supabase (hosted)  |
| ORM      | Prisma                            |
| Auth     | JWT (access + refresh tokens)     |

---

## Project Structure

```
hotel-mgmt/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # DB schema + migrations
│   ├── src/
│   │   ├── routes/
│   │   │   ├── rooms.js
│   │   │   ├── reservations.js
│   │   │   ├── guests.js
│   │   │   ├── staff.js
│   │   │   ├── housekeeping.js
│   │   │   └── billing.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verify
│   │   │   └── rbac.js            # role-based access
│   │   ├── services/              # business logic, decoupled from routes
│   │   └── index.js               # app entry
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Rooms.jsx
    │   │   ├── Reservations.jsx
    │   │   ├── Guests.jsx
    │   │   ├── Housekeeping.jsx
    │   │   └── Billing.jsx
    │   ├── components/            # shared UI components
    │   ├── api/                   # axios wrappers per module
    │   └── App.jsx
    └── package.json
```

---

## Database Schema

### `room_types`
| Column       | Type    | Notes                  |
|--------------|---------|------------------------|
| id           | int PK  |                        |
| name         | varchar | e.g. "Deluxe Suite"    |
| base_price   | decimal |                        |
| max_occupancy| int     |                        |
| amenities    | jsonb   |                        |

### `rooms`
| Column       | Type    | Notes                        |
|--------------|---------|------------------------------|
| id           | int PK  |                              |
| room_number  | varchar | unique                       |
| floor        | int     |                              |
| room_type_id | int FK  | → room_types                 |
| status       | enum    | available/occupied/cleaning  |

### `guests`
| Column        | Type    | Notes               |
|---------------|---------|---------------------|
| id            | int PK  |                     |
| name          | varchar |                     |
| email         | varchar | unique              |
| phone         | varchar |                     |
| id_number     | varchar | passport/national ID|
| loyalty_points| int     |                     |
| preferences   | jsonb   |                     |
| created_at    | timestamp |                   |

### `reservations`
| Column       | Type      | Notes                                |
|--------------|-----------|--------------------------------------|
| id           | int PK    |                                      |
| guest_id     | int FK    | → guests                             |
| room_id      | int FK    | → rooms                              |
| check_in     | date      |                                      |
| check_out    | date      |                                      |
| adults       | int       |                                      |
| children     | int       |                                      |
| status       | enum      | confirmed/checked_in/checked_out/cancelled |
| notes        | text      |                                      |
| created_at   | timestamp |                                      |

### `staff`
| Column    | Type    | Notes                              |
|-----------|---------|------------------------------------|
| id        | int PK  |                                    |
| name      | varchar |                                    |
| email     | varchar | unique, used for login             |
| password  | varchar | hashed                             |
| role      | enum    | admin/front_desk/housekeeping/manager |
| shift     | enum    | morning/evening/night              |

### `housekeeping_tasks`
| Column      | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | int PK    |                                |
| room_id     | int FK    | → rooms                        |
| assigned_to | int FK    | → staff                        |
| type        | enum      | clean/inspect/restock/repair   |
| status      | enum      | pending/in_progress/done       |
| priority    | enum      | low/normal/urgent              |
| notes       | text      |                                |
| created_at  | timestamp |                                |
| completed_at| timestamp |                                |

### `invoices`
| Column        | Type      | Notes                       |
|---------------|-----------|-----------------------------|
| id            | int PK    |                             |
| reservation_id| int FK    | → reservations              |
| subtotal      | decimal   |                             |
| tax           | decimal   |                             |
| discount      | decimal   |                             |
| total         | decimal   |                             |
| status        | enum      | draft/issued/paid/void      |
| issued_at     | timestamp |                             |

### `payments`
| Column     | Type      | Notes                           |
|------------|-----------|---------------------------------|
| id         | int PK    |                                 |
| invoice_id | int FK    | → invoices                      |
| amount     | decimal   |                                 |
| method     | enum      | cash/card/bank_transfer/upi     |
| paid_at    | timestamp |                                 |

---

## API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
```

### Rooms
```
GET    /api/rooms                  # list all rooms (filter: status, floor, type)
GET    /api/rooms/available?check_in=&check_out=
GET    /api/rooms/:id
POST   /api/rooms                  # create room (admin)
PATCH  /api/rooms/:id
PATCH  /api/rooms/:id/status       # quick status update
DELETE /api/rooms/:id              # admin only
GET    /api/room-types
POST   /api/room-types
```

### Reservations
```
GET    /api/reservations           # list (filter: status, date range, guest)
GET    /api/reservations/:id
POST   /api/reservations           # create booking
PATCH  /api/reservations/:id
POST   /api/reservations/:id/check-in
POST   /api/reservations/:id/check-out
POST   /api/reservations/:id/cancel
```

### Guests
```
GET    /api/guests                 # list (search by name/email)
GET    /api/guests/:id
GET    /api/guests/:id/reservations
POST   /api/guests
PATCH  /api/guests/:id
```

### Staff & Housekeeping
```
GET    /api/staff
GET    /api/staff/:id
POST   /api/staff                  # admin only
PATCH  /api/staff/:id
DELETE /api/staff/:id              # admin only

GET    /api/housekeeping           # list tasks (filter: status, room, assigned_to)
GET    /api/housekeeping/:id
POST   /api/housekeeping           # create task
PATCH  /api/housekeeping/:id
PATCH  /api/housekeeping/:id/status
```

### Billing
```
GET    /api/invoices
GET    /api/invoices/:id
POST   /api/invoices               # generate for reservation
PATCH  /api/invoices/:id/void
POST   /api/invoices/:id/payments  # record payment
GET    /api/invoices/:id/payments
```

---

## Frontend Pages

| Page           | Route                | Key Features                              |
|----------------|----------------------|-------------------------------------------|
| Dashboard      | `/`                  | Occupancy summary, today's arrivals/departures, pending tasks |
| Rooms          | `/rooms`             | Room grid by floor, status color coding, quick status toggle |
| Reservations   | `/reservations`      | Calendar view + table, new booking form, check-in/out actions |
| Guests         | `/guests`            | Search, profile view, reservation history |
| Housekeeping   | `/housekeeping`      | Task board (Kanban by status), assign staff |
| Billing        | `/billing`           | Invoice list, payment recording, receipt print |
| Staff          | `/staff`             | Staff list, add/edit, role management (admin only) |

---

## Role-Based Access

| Role          | Permissions                                           |
|---------------|-------------------------------------------------------|
| admin         | Full access to all modules + staff management         |
| manager       | All modules, no staff deletion                        |
| front_desk    | Reservations, guests, billing view                    |
| housekeeping  | Own tasks only                                        |

---

## Key Packages

**Backend**
- `express` — HTTP server
- `prisma` — ORM + migrations
- `pg` — PostgreSQL driver
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT
- `zod` — request validation

**Frontend**
- `react-router-dom` — routing
- `axios` — HTTP client
- `@tanstack/react-query` — server state / caching
- `tailwindcss` — styling
- `react-hook-form` + `zod` — forms + validation
- `date-fns` — date handling

---

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
JWT_SECRET=
JWT_REFRESH_SECRET=
PORT=4000

# Frontend
VITE_API_URL=http://localhost:4000/api
```

---

## Dev Setup

```bash
# 1. Start PostgreSQL
# 2. Backend
cd backend && npm install
npx prisma migrate dev
npm run dev          # nodemon, port 4000

# 3. Frontend
cd frontend && npm install
npm run dev          # vite, port 5173
```

---

## Build Order

1. Prisma schema + migrations
2. Auth (login, JWT middleware, RBAC)
3. Rooms + Room Types CRUD
4. Guests CRUD
5. Reservations (with availability check logic)
6. Housekeeping tasks
7. Billing + Payments
8. React frontend — pages per module in same order
9. Dashboard with aggregated stats


Backend build order:

Project scaffold — backend/ folder, package.json, src/index.js, .env.example, folder structure
Prisma schema — all 8 tables defined, prisma migrate dev ready to run against Supabase
Auth — POST /api/auth/login, JWT sign, POST /api/auth/refresh, auth middleware + RBAC middleware
Rooms — room types CRUD, rooms CRUD, status patch
Guests — CRUD + search
Reservations — CRUD + availability check logic (no double-booking) + check-in/check-out/cancel actions
Housekeeping — tasks CRUD + status patch
Billing — invoice generation from reservation, payment recording, void
Validation layer — Zod schemas on all routes (request body + query params)
Wire frontend — swap mock data for axios calls to the real API