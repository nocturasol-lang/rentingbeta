import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerCaller } from '@/lib/trpc-server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, Bed, Bath, Users, Ruler, Waves, Clock } from 'lucide-react'
import { AmenityIcon } from '@/components/public/amenity-icon'
import { AvailabilityPicker } from '@/components/public/availability-picker'
import { PhotoGallery } from '@/components/public/photo-gallery'
import { StickyBookBar } from '@/components/public/sticky-book-bar'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trpc = await createServerCaller()
  try {
    const property = await trpc.properties.getBySlug({ slug })
    return {
      title: `${property.name} — Georgia's Cozy Rooms`,
      description: property.description.substring(0, 160),
    }
  } catch {
    return { title: 'Property Not Found' }
  }
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params
  const trpc = await createServerCaller()

  let property
  try {
    property = await trpc.properties.getBySlug({ slug })
  } catch {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: 'Kavala',
      addressCountry: 'GR',
    },
    priceRange: `€${(property.pricePerNightCents / 100).toFixed(0)}`,
    ...(property.reviewScore && property.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: property.reviewScore,
            reviewCount: property.reviewCount,
            bestRating: 10,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{property.name}</h1>
          <p className="text-muted-foreground mt-1">{property.address}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div>
              <span className="text-xl font-bold">&euro;{(property.pricePerNightCents / 100).toFixed(0)}</span>
              <span className="text-sm text-muted-foreground"> / night</span>
            </div>
            {property.reviewScore && (
              <Badge className="bg-[#1B4F72] text-white gap-1">
                <Star className="h-3 w-3 fill-current" />
                {property.reviewScore}
              </Badge>
            )}
            {property.reviewCount && (
              <span className="text-sm text-muted-foreground">{property.reviewCount} reviews</span>
            )}
          </div>
        </div>

        {/* Photo gallery */}
        <PhotoGallery
          images={property.images.map((img) => ({ url: img.url, alt: img.alt }))}
          propertyName={property.name}
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Facts grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Fact icon={Bed} label="Bedrooms" value={String(property.bedrooms)} />
              <Fact icon={Bath} label="Bathrooms" value={String(property.bathrooms)} />
              <Fact icon={Users} label="Max Guests" value={String(property.maxGuests)} />
              {property.size && <Fact icon={Ruler} label="Size" value={`${property.size} m²`} />}
              {property.blockedRanges && <Fact icon={Waves} label="Beach" value={`Nearby`} />}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-3">About this property</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            <Separator />

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <AmenityIcon key={amenity} amenity={amenity} />
                ))}
              </div>
            </div>

            <Separator />

            {/* House rules */}
            <div>
              <h2 className="text-lg font-semibold mb-3">House Rules</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Check-in: {property.checkInFrom} – {property.checkInTo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Check-out: {property.checkOutFrom} – {property.checkOutTo}</span>
                </div>
                {property.minNights > 1 && (
                  <div className="text-muted-foreground">
                    Minimum stay: {property.minNights} nights
                  </div>
                )}
                {property.licenseNumber && (
                  <div className="text-muted-foreground">
                    License: {property.licenseNumber}
                  </div>
                )}
                <div className="col-span-2 text-muted-foreground">
                  Cancellation: {property.cancellationPolicy === 'FLEXIBLE'
                    ? 'Free cancellation up to 24 hours before check-in'
                    : property.cancellationPolicy === 'MODERATE'
                    ? 'Free cancellation up to 5 days before check-in'
                    : 'Non-refundable'}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — availability picker */}
          <div id="availability-picker" className="lg:sticky lg:top-20 lg:self-start scroll-mt-20">
            <AvailabilityPicker
              propertyId={property.id}
              slug={property.slug}
              blockedRanges={property.blockedRanges}
              minNights={property.minNights}
            />
          </div>
        </div>

        {/* Bottom padding for sticky bar on mobile */}
        <div className="h-20 lg:hidden" />
      </div>

      {/* Sticky booking bar — mobile only */}
      <StickyBookBar
        pricePerNightCents={property.pricePerNightCents}
        slug={property.slug}
      />
    </>
  )
}

function Fact({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <Icon className="h-5 w-5 mx-auto text-muted-foreground" />
      <p className="text-sm font-medium mt-1">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
