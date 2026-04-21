# Tech Stack — Locked

No substitutions without asking first.

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript strict |
| API | tRPC v11 |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache/Locks | Redis (ioredis) |
| Jobs | BullMQ |
| Auth | NextAuth.js v5 (admin only) |
| Payments | Stripe + Stripe Connect |
| Email | Resend |
| Styling | Tailwind CSS + shadcn/ui |
| Hosting | Railway |
| Testing | Vitest + Playwright |

## Banned

| Banned | Use instead |
|---|---|
| `moment.js` | `date-fns` |
| `axios` | native `fetch` |
| Any other ORM | Prisma |
| `setInterval` for jobs | BullMQ |
| `mongoose` | Prisma (PostgreSQL) |
