import { Suspense } from 'react'
import { createServerCaller } from '@/lib/trpc-server'
import { PropertyCard } from '@/components/public/property-card'
import { SearchBar } from '@/components/public/search-bar'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}) {
  const params = await searchParams
  const trpc = await createServerCaller()

  const properties = await trpc.properties.list({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests ? parseInt(params.guests) : undefined,
  })

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1B4F72] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Book Direct &mdash; Save on Fees
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Cozy apartments in Kavala, Greece. Steps from Kalamitsa Beach.
            No middleman, no commission &mdash; just you and Georgia.
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="mx-auto max-w-3xl px-4 -mt-7 relative z-10">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Property grid */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-semibold mb-6">Our Properties</h2>
        {properties.length === 0 ? (
          <p className="text-muted-foreground">No properties match your search.</p>
        ) : (
          <div className={`grid gap-6 ${properties.length === 1 ? 'max-w-lg mx-auto' : 'sm:grid-cols-2'}`}>
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                description={p.description}
                pricePerNightCents={p.pricePerNightCents}
                cleaningFeeCents={p.cleaningFeeCents}
                currency={p.currency}
                maxGuests={p.maxGuests}
                bedrooms={p.bedrooms}
                images={p.images}
                reviewScore={p.reviewScore}
                reviewCount={p.reviewCount}
                beachDistanceM={p.beachDistanceM}
                available={p.available}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
