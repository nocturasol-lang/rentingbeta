import { NextRequest, NextResponse } from 'next/server'
import { triggerManualSync } from '@/server/queue/ical-sync'
import { prisma } from '@/server/db'
import { timingSafeStringCompare } from '@/lib/crypto-utils'
import { env } from '@/env'

/**
 * Internal endpoint to manually trigger iCal sync.
 * Protected by INTERNAL_SECRET bearer token (timing-safe comparison).
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${env.INTERNAL_SECRET}`

  if (!auth || !timingSafeStringCompare(auth, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { propertyId?: string }

  await triggerManualSync(body.propertyId)

  const count = body.propertyId
    ? 1
    : await prisma.property.count({
        where: { isActive: true, icalUrl: { not: null } },
      })

  return NextResponse.json({ queued: count })
}
