# SBill — Split Bill Platform

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node 20 (for local dev)

### Setup

```bash
cp .env.example .env
# Fill in JWT_SECRET, JWT_REFRESH_SECRET, GEMINI_API_KEY
```

### Run with Docker

```bash
docker compose up -d
```

App available at http://localhost

### Local Development

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

## Architecture

- **Frontend**: Next.js 15 + TailwindCSS + shadcn/ui (port 3000)
- **Backend API**: NestJS + Prisma (port 3001)
- **OCR Worker**: BullMQ worker consuming the OCR queue
- **Database**: PostgreSQL 16
- **Queue**: Redis 7
- **Proxy**: Nginx

## API Summary

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| POST | /bills | Create bill |
| GET | /bills | List bills |
| GET | /bills/:id | Get bill detail |
| PUT | /bills/:id/items | Update items |
| POST | /bills/:id/participants | Add participant |
| DELETE | /bills/:id/participants/:pid | Remove participant |
| PUT | /bills/:id/assignments | Assign items |
| GET | /bills/:id/split | Calculate totals |
| POST | /bills/:id/finalize | Finalize bill |
| DELETE | /bills/:id | Delete bill |
| POST | /ocr/upload | Upload receipt |
| GET | /ocr/jobs/:id | OCR job status |
| GET | /health | Health check |
