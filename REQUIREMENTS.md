# Requirements & Deployment Guide

This is a Node.js project — dependencies are managed via `package.json`, not `requirements.txt`.

---

## System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| PostgreSQL | 14 | 16 |

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>"
JWT_SECRET="<random 64-char string>"
JWT_REFRESH_SECRET="<different random 64-char string>"
PORT=4000
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://your-backend-domain.com/api
```

---

## Backend Dependencies

```
express         ^4.21   — HTTP server
@prisma/client  ^5.22   — Database ORM
prisma          ^5.22   — Schema + migration tooling (dev)
bcrypt          ^5.1    — Password hashing
jsonwebtoken    ^9.0    — JWT auth
cors            ^2.8    — CORS middleware
dotenv          ^16.4   — Env var loading
zod             ^3.23   — Request validation
nodemon         ^3.1    — Dev auto-reload (dev only)
```

## Frontend Dependencies

```
react               ^18.3  — UI framework
react-dom           ^18.3  — DOM renderer
react-router-dom    ^6.26  — Client-side routing
axios               ^1.17  — HTTP client
lucide-react        ^0.462 — Icon library
tailwindcss         ^3.4   — CSS framework (build only)
vite                ^5.4   — Build tool (build only)
```

---

## Local Setup

```bash
# 1. Install all dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Create PostgreSQL database
createdb hotel_mgmt

# 3. Set up backend .env (see above)

# 4. Run Prisma migrations + seed
cd backend
npx prisma migrate deploy
npm run seed   # creates admin@hotel.com / admin123

# 5. Start both servers
cd backend && npm run dev     # http://localhost:4000
cd frontend && npm run dev    # http://localhost:5173
```

---

## Deployment Options

### Option A — Railway (easiest, ~$5/month)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`
4. Set env vars in Railway dashboard (JWT secrets, PORT)
5. Deploy backend — Railway runs `npm start`
6. For frontend: deploy separately or use Railway static hosting
7. Set `VITE_API_URL` to your Railway backend URL before building frontend

### Option B — Render (free tier available)

**Backend:**
1. New Web Service → connect GitHub repo → Root directory: `backend`
2. Build command: `npm install && npx prisma migrate deploy`
3. Start command: `npm start`
4. Add environment variables in Render dashboard
5. Add a **Render Postgres** database, copy connection string to `DATABASE_URL`

**Frontend:**
1. New Static Site → connect same repo → Root directory: `frontend`
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add env var: `VITE_API_URL=https://your-render-backend.onrender.com/api`

### Option C — VPS / DigitalOcean ($6/month droplet)

```bash
# On server:
apt update && apt install -y nodejs npm postgresql nginx

# Clone repo, install deps
git clone <your-repo>
cd project/backend && npm install
npx prisma migrate deploy
npm run seed

# Install PM2 (process manager)
npm install -g pm2
pm2 start src/index.js --name hotel-backend
pm2 save && pm2 startup

# Build frontend
cd ../frontend
echo "VITE_API_URL=https://yourdomain.com/api" > .env
npm install && npm run build
# Copy dist/ to nginx web root
cp -r dist/* /var/www/html/

# Configure nginx to:
# - Serve /var/www/html for frontend
# - Proxy /api/* to localhost:4000
```

---

## Pre-Deployment Checklist

- [ ] Change JWT secrets from defaults to random 64-char strings
- [ ] Point `DATABASE_URL` to production Postgres (not localhost)
- [ ] Set `VITE_API_URL` to production backend URL before `npm run build`
- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] Run `npm run seed` once to create initial admin account
- [ ] Change admin password after first login (no UI yet — use API: `PUT /api/staff/:id`)
- [ ] Enable HTTPS (Railway/Render do this automatically; VPS needs Certbot)
- [ ] Update CORS in `backend/src/index.js` to allow your production frontend domain

---

## CORS Update for Production

In `backend/src/index.js`, change:

```js
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
```

To:

```js
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
```

Then add `FRONTEND_URL=https://your-frontend-domain.com` to backend env vars.
