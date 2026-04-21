# Non-Negotiable Rules

1. **TypeScript strict** — no `any`, no `as unknown as X`. Fix the type properly.
2. **Prisma transactions for all availability writes** — no exceptions. Overbooking is the worst bug.
3. **Always re-validate availability server-side** — never trust client-supplied dates.
4. **iCal blocks always win** — external block = date unavailable, period.
5. **All money in cents (integers)** — EUR 95.00 = `9500`. Never floats.
6. **Redis lock during checkout** — key: `lock:property:{id}:{checkIn}:{checkOut}`, TTL 600s, SET NX.
7. **BullMQ for all jobs** — no `setInterval`, no cron. BullMQ repeatable jobs only.
8. **Every tRPC mutation logged** — middleware logger: procedure name, user id, timestamp.
9. **`platform_fee_percent` from DB** — never hardcode. Always read from property record.
10. **Finish each stage before starting the next** — check `docs/CONTEXT.md` for current stage.
