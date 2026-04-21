import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { auth } from '@/server/auth'
import { prisma } from '@/server/db'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  // Admin only
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const propertyId = formData.get('propertyId') as string | null

  if (!file || !propertyId) {
    return NextResponse.json({ error: 'File and propertyId required' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only jpg, png, and webp allowed' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  // Verify property exists
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads', propertyId)
  await mkdir(dir, { recursive: true })

  // Write file
  const bytes = await file.arrayBuffer()
  await writeFile(path.join(dir, filename), Buffer.from(bytes))

  // Get next position
  const lastImage = await prisma.propertyImage.findFirst({
    where: { propertyId },
    orderBy: { position: 'desc' },
  })
  const position = (lastImage?.position ?? -1) + 1

  // Create DB record
  const image = await prisma.propertyImage.create({
    data: {
      propertyId,
      url: `/uploads/${propertyId}/${filename}`,
      alt: property.name,
      position,
    },
  })

  return NextResponse.json(image)
}
