@AGENTS.md

# Georgia's Cozy Rooms — Kavala, Greece

Direct booking platform. 4 rental apartments. Admin dashboard + public guest website.
Replaces Booking.com commission with 0% direct bookings.

## How to work

1. Rules auto-load from `.claude/rules/` — always active
2. Read `docs/CONTEXT.md` — tells you which stage is active and what's done
3. Go to the active stage file in `docs/stages/` — it has inputs, process, outputs, audit
4. Stage inputs point to specs in `docs/specs/` and data in `docs/data/` — read only what the stage requires
5. When the stage audit passes, update `docs/CONTEXT.md` status and move to the next stage

## Key paths

- `prisma/schema.prisma` — single source of truth for data models
- `src/server/` — backend: db, redis, trpc, queue
- `src/lib/` — business logic: fees, availability, ical, stripe
- `src/app/(admin)/` — admin routes (auth required)
- `src/app/(public)/` — guest routes (no auth)
- `src/app/api/` — trpc handler, auth handler, webhooks
- `jobs/` — standalone BullMQ scheduler
- `tests/` — unit and e2e tests
