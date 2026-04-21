import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readdirSync, copyFileSync, mkdirSync } from 'fs'
import path from 'path'
import { config } from 'dotenv'

config() // Load .env

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

const PHOTOS_DIR = '/Users/xristos/Downloads'
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// Map property number to slug
const propertyMap: Record<string, string> = {
  '1': 'georgias-cozy-rooms-1',
  '2': 'georgias-cozy-rooms-2',
  '3': 'georgias-cozy-rooms-3',
  '4': 'georgias-cozy-rooms-4',
}

async function main() {
  // Get property IDs by slug
  const properties = await prisma.property.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
  })

  const slugToId: Record<string, string> = {}
  const slugToName: Record<string, string> = {}
  for (const p of properties) {
    slugToId[p.slug] = p.id
    slugToName[p.slug] = p.name
  }

  console.log('Properties found:', properties.map(p => `${p.slug} → ${p.id}`))

  // Delete existing images from DB
  const deleted = await prisma.propertyImage.deleteMany({})
  console.log(`Cleared ${deleted.count} existing image records`)

  // Get all photo files
  const allFiles = readdirSync(PHOTOS_DIR)
    .filter(f => f.startsWith('property') && f.endsWith('.jpg'))
    .sort()

  console.log(`Found ${allFiles.length} photos`)

  let total = 0

  for (const [propNum, slug] of Object.entries(propertyMap)) {
    const propId = slugToId[slug]
    if (!propId) {
      console.error(`Property ${slug} not found in DB!`)
      continue
    }

    // Create upload directory
    const uploadDir = path.join(UPLOADS_DIR, propId)
    mkdirSync(uploadDir, { recursive: true })

    // Get files for this property
    const files = allFiles.filter(f => f.startsWith(`property${propNum}_`)).sort()
    console.log(`\nProperty ${propNum} (${slugToName[slug]}): ${files.length} photos`)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const src = path.join(PHOTOS_DIR, file)
      const dest = path.join(uploadDir, file)

      // Copy file
      copyFileSync(src, dest)

      // Create DB record
      await prisma.propertyImage.create({
        data: {
          propertyId: propId,
          url: `/uploads/${propId}/${file}`,
          alt: `${slugToName[slug]} — Photo ${i + 1}`,
          position: i,
        },
      })

      total++
    }
  }

  console.log(`\nDone! Imported ${total} photos.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
