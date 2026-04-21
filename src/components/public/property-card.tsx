'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bed, Users, Waves, Star } from 'lucide-react'
import { PhotoCarousel } from '@/components/public/photo-carousel'

interface PropertyCardProps {
  slug: string
  name: string
  description: string
  pricePerNightCents: number
  cleaningFeeCents: number
  currency: string
  maxGuests: number
  bedrooms: number
  images: Array<{ url: string; alt: string | null }>
  reviewScore: number | null
  reviewCount: number | null
  beachDistanceM: number | null
  available: boolean | null
}

export function PropertyCard({ slug, name, description, pricePerNightCents, maxGuests, bedrooms, images, reviewScore, reviewCount, beachDistanceM, available }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {/* Carousel is OUTSIDE the link — arrows work independently */}
      <div className="relative">
        <PhotoCarousel images={images} aspectRatio="card" />
        {reviewScore && (
          <Badge className="absolute top-3 right-3 z-10 bg-[#1B4F72] text-white gap-1 pointer-events-none">
            <Star className="h-3 w-3 fill-current" />
            {reviewScore}
          </Badge>
        )}
        {available === false && (
          <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="text-white font-medium text-sm">Not available for selected dates</span>
          </div>
        )}
      </div>

      {/* Only the info section is a link */}
      <Link href={`/properties/${slug}`}>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-base">{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {maxGuests} guests
            </span>
            {beachDistanceM && (
              <span className="flex items-center gap-1">
                <Waves className="h-3.5 w-3.5" /> {beachDistanceM}m to beach
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <span className="text-lg font-bold">&euro;{(pricePerNightCents / 100).toFixed(0)}</span>
              <span className="text-xs text-muted-foreground"> / night</span>
            </div>
            {reviewCount && (
              <span className="text-xs text-muted-foreground">{reviewCount} reviews</span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
