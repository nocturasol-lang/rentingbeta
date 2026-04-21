import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { addDays, nextMonday } from 'date-fns'
import { readdirSync } from 'fs'
import { join } from 'path'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

// Fixed IDs — must match the upload folder names in public/uploads/
const PROPERTY_IDS = {
  1: 'cmnj2oay500011lx772n58b5p',
  2: 'cmnj2oay900021lx73fxsgnl7',
  3: 'cmnj2oayc00031lx7oh7wpm0c',
  4: 'cmnj2oayf00041lx7b5vhr2jm',
} as const

async function main() {
  console.log('Seeding database...')

  // 1. Create admin user
  const passwordHash = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@georgiascosyrooms.gr' },
    update: {},
    create: {
      email: 'admin@georgiascosyrooms.gr',
      name: 'Georgia',
      password: passwordHash,
      role: 'ADMIN',
    },
  })
  console.log(`Admin user: ${admin.email}`)

  // 2. Create all 4 properties (with fixed IDs matching upload folders)
  const property1 = await prisma.property.upsert({
    where: { slug: 'georgias-cozy-rooms-1' },
    update: {},
    create: {
      id: PROPERTY_IDS[1],
      slug: 'georgias-cozy-rooms-1',
      name: "Georgia's Cozy Rooms #1",
      description:
        'A spacious 150 m² maisonette — the entire place is yours. Four bedrooms each with a large double bed, plus a sofa bed in the living room, sleeping up to 9 guests. Two bathrooms (one with a bathtub), a fully equipped kitchen with dishwasher and coffee machine, and air conditioning and Netflix in every room. Private terrace with BBQ, garden and mountain views, and free parking for 2 cars. A 5-minute walk to Kalamitsa Beach. Perfect for families and groups.',
      address: '43 Kastamonis, Kavala 65404, Greece',
      city: 'Kavala',
      country: 'GR',
      size: 150,
      pricePerNightCents: 12000,
      cleaningFeeCents: 5000,
      currency: 'EUR',
      platformFeePercent: 0,
      maxGuests: 9,
      bedrooms: 4,
      bathrooms: 2,
      amenities: [
        'wifi', 'air_conditioning_every_room', 'tv_every_room', 'netflix', 'satellite_tv',
        'fully_equipped_kitchen', 'dishwasher', 'coffee_machine', 'kettle', 'washing_machine',
        'hair_dryer', 'toiletries', 'balcony', 'garden', 'terrace', 'bbq', 'mountain_view',
        'garden_view', 'free_parking', 'self_checkin',
      ],
      licenseNumber: '00002870917',
      reviewScore: 9.4,
      reviewCount: 75,
      beachDistanceM: 550,
      checkInFrom: '15:00',
      checkInTo: '19:00',
      checkOutFrom: '08:00',
      checkOutTo: '10:00',
      minNights: 1,
    },
  })

  const property2 = await prisma.property.upsert({
    where: { slug: 'georgias-cozy-rooms-2' },
    update: {},
    create: {
      id: PROPERTY_IDS[2],
      slug: 'georgias-cozy-rooms-2',
      name: "Georgia's Cozy Rooms #2",
      description:
        'A cozy 25 m² apartment — the entire place is yours. One bedroom with a double bed, walk-in shower, kitchenette, and balcony. Air conditioning, free WiFi, a work desk, and free on-site parking including an EV charging station. Ideal for couples. Kalamitsa Beach is 400 m away. Lidl supermarket nearby.',
      address: '43 Kastamonis, Kavala 65404, Greece',
      city: 'Kavala',
      country: 'GR',
      size: 25,
      pricePerNightCents: 6500,
      cleaningFeeCents: 2500,
      currency: 'EUR',
      platformFeePercent: 0,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [
        'wifi', 'air_conditioning', 'kitchenette', 'work_desk', 'walk_in_shower',
        'balcony', 'free_parking', 'ev_charging', 'self_checkin', 'non_smoking',
      ],
      licenseNumber: '00002634059',
      reviewScore: 8.8,
      reviewCount: 70,
      beachDistanceM: 400,
      checkInFrom: '14:00',
      checkInTo: '15:00',
      checkOutFrom: '08:00',
      checkOutTo: '10:00',
      minNights: 1,
    },
  })

  const property3 = await prisma.property.upsert({
    where: { slug: 'georgias-cozy-rooms-3' },
    update: {},
    create: {
      id: PROPERTY_IDS[3],
      slug: 'georgias-cozy-rooms-3',
      name: "Georgia's Cozy Rooms #3",
      description:
        'Our most-reviewed apartment — 97 guests and counting. A spotlessly clean 25 m² apartment with a private entrance and balcony — the entire place is yours. One bedroom, private bathroom, and a fully equipped kitchen with a coffee pod machine and oven. Smart TV with streaming, washing machine, and a terrace with outdoor seating. Free parking. Just 200 m from the sea.',
      address: '43 Kastamonis, Kavala 65404, Greece',
      city: 'Kavala',
      country: 'GR',
      size: 25,
      pricePerNightCents: 6500,
      cleaningFeeCents: 2500,
      currency: 'EUR',
      platformFeePercent: 0,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [
        'wifi', 'air_conditioning', 'fully_equipped_kitchen', 'coffee_machine_pods',
        'oven', 'washing_machine', 'smart_tv', 'streaming_services', 'toiletries',
        'balcony', 'terrace', 'outdoor_furniture', 'garden_view', 'private_entrance',
        'free_parking', 'self_checkin', 'non_smoking',
      ],
      licenseNumber: '00001132730',
      reviewScore: 9.2,
      reviewCount: 97,
      beachDistanceM: 450,
      checkInFrom: '14:00',
      checkInTo: '15:00',
      checkOutFrom: '08:30',
      checkOutTo: '10:00',
      minNights: 1,
    },
  })

  const property4 = await prisma.property.upsert({
    where: { slug: 'georgias-cozy-rooms-4' },
    update: {},
    create: {
      id: PROPERTY_IDS[4],
      slug: 'georgias-cozy-rooms-4',
      name: "Georgia's Cozy Rooms #4",
      description:
        'A bright 32 m² apartment with sea and hill views from the balcony — the entire place is yours. One bedroom with a double bed, private bathroom, kitchenette, and a terrace with BBQ. Air conditioning, free WiFi, and free parking. In a peaceful and safe neighbourhood, 6 minutes walk to Kalamitsa Beach.',
      address: '43 Kastamonis, Kavala 65404, Greece',
      city: 'Kavala',
      country: 'GR',
      size: 32,
      pricePerNightCents: 7000,
      cleaningFeeCents: 2500,
      currency: 'EUR',
      platformFeePercent: 0,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [
        'wifi', 'air_conditioning', 'kitchenette', 'walk_in_shower', 'balcony', 'terrace',
        'sea_view', 'hill_view', 'outdoor_seating', 'bbq', 'free_parking', 'self_checkin',
        'non_smoking',
      ],
      licenseNumber: '00002832554',
      reviewScore: 8.6,
      reviewCount: 79,
      beachDistanceM: 500,
      checkInFrom: '15:00',
      checkInTo: '19:00',
      checkOutFrom: '08:00',
      checkOutTo: '10:00',
      minNights: 1,
    },
  })

  console.log(`Created properties: ${property1.name}, ${property2.name}, ${property3.name}, ${property4.name}`)

  // 3. Seed property images from public/uploads/ folders
  const uploadsDir = join(__dirname, '..', 'public', 'uploads')
  const properties = [property1, property2, property3, property4]
  let totalImages = 0

  for (const property of properties) {
    const propertyDir = join(uploadsDir, property.id)
    let files: string[]
    try {
      files = readdirSync(propertyDir).filter(f => f.endsWith('.jpg')).sort()
    } catch {
      console.log(`  No upload folder for ${property.name}, skipping images`)
      continue
    }

    // Delete existing images for this property (idempotent re-seed)
    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } })

    // Insert all images with position based on filename order
    await prisma.propertyImage.createMany({
      data: files.map((file, index) => ({
        propertyId: property.id,
        url: `/uploads/${property.id}/${file}`,
        position: index,
      })),
    })

    totalImages += files.length
    console.log(`  ${property.name}: ${files.length} images`)
  }
  console.log(`Seeded ${totalImages} images total`)

  // 4. Create a sample booking (so calendar is not empty on first run)
  // First Monday 3 weeks from today, 4 nights on Cozy #3
  const threeWeeksFromNow = addDays(new Date(), 21)
  const checkIn = nextMonday(threeWeeksFromNow)
  const checkOut = addDays(checkIn, 4)

  const sampleBooking = await prisma.booking.upsert({
    where: { reference: 'KVL-DEMO0001' },
    update: {},
    create: {
      reference: 'KVL-DEMO0001',
      propertyId: property3.id,
      guestName: 'Test Guest',
      guestEmail: 'guest@test.com',
      guestCount: 2,
      checkIn,
      checkOut,
      nights: 4,
      pricePerNightCents: 6500,
      cleaningFeeCents: 2500,
      platformFeeCents: 0,
      ownerPayoutCents: 28500,
      totalCents: 28500, // 4 × 6500 + 2500 = €285
      platformFeePercent: 0,
      currency: 'EUR',
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      source: 'DIRECT',
    },
  })

  console.log(
    `Sample booking: ${sampleBooking.reference} — ${property3.name} — ${checkIn.toISOString().split('T')[0]} to ${checkOut.toISOString().split('T')[0]}`
  )

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
