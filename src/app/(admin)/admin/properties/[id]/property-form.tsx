'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { amenityList, amenityCategories } from '@/lib/amenities'

interface PropertyFormProps {
  property: {
    name: string
    slug: string
    description: string
    address: string
    size: number | null
    pricePerNightCents: number
    cleaningFeeCents: number
    maxGuests: number
    bedrooms: number
    bathrooms: number
    amenities: string[]
    icalUrl: string | null
    licenseNumber: string | null
    checkInFrom: string
    checkInTo: string
    checkOutFrom: string
    checkOutTo: string
    minNights: number
    isActive: boolean
  }
  onSubmit: (data: Record<string, unknown>) => void
  isPending: boolean
  error?: string
}

export function PropertyForm({ property, onSubmit, isPending, error }: PropertyFormProps) {
  const [form, setForm] = useState({
    name: property.name,
    slug: property.slug,
    description: property.description,
    address: property.address,
    size: property.size ?? 0,
    pricePerNightCents: property.pricePerNightCents,
    cleaningFeeCents: property.cleaningFeeCents,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    amenities: property.amenities as string[],
    icalUrl: property.icalUrl ?? '',
    licenseNumber: property.licenseNumber ?? '',
    checkInFrom: property.checkInFrom,
    checkInTo: property.checkInTo,
    checkOutFrom: property.checkOutFrom,
    checkOutTo: property.checkOutTo,
    minNights: property.minNights,
    isActive: property.isActive,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name: form.name,
      slug: form.slug,
      description: form.description,
      address: form.address,
      size: form.size || undefined,
      pricePerNightCents: form.pricePerNightCents,
      cleaningFeeCents: form.cleaningFeeCents,
      maxGuests: form.maxGuests,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      amenities: form.amenities,
      icalUrl: form.icalUrl || null,
      licenseNumber: form.licenseNumber || null,
      checkInFrom: form.checkInFrom,
      checkInTo: form.checkInTo,
      checkOutFrom: form.checkOutFrom,
      checkOutTo: form.checkOutTo,
      minNights: form.minNights,
      isActive: form.isActive,
    })
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input id="licenseNumber" value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" type="number" min={1} value={form.bedrooms} onChange={(e) => set('bedrooms', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" type="number" min={1} value={form.bathrooms} onChange={(e) => set('bathrooms', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGuests">Max Guests</Label>
              <Input id="maxGuests" type="number" min={1} value={form.maxGuests} onChange={(e) => set('maxGuests', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size (m²)</Label>
              <Input id="size" type="number" min={0} value={form.size} onChange={(e) => set('size', parseInt(e.target.value))} />
            </div>
          </div>
          <div className="space-y-4">
            <Label>Amenities ({form.amenities.length} selected)</Label>
            {amenityCategories.map((category) => (
              <div key={category}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {amenityList
                    .filter((a) => a.category === category)
                    .map(({ key, label }) => {
                      const checked = form.amenities.includes(key)
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                            checked ? 'bg-primary/10 border-primary text-foreground' : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? form.amenities.filter((a) => a !== key)
                                : [...form.amenities, key]
                              set('amenities', next)
                            }}
                            className="rounded border-input"
                          />
                          <span>{label}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price/night (cents)</Label>
              <Input id="price" type="number" min={0} value={form.pricePerNightCents} onChange={(e) => set('pricePerNightCents', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaning">Cleaning fee (cents)</Label>
              <Input id="cleaning" type="number" min={0} value={form.cleaningFeeCents} onChange={(e) => set('cleaningFeeCents', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minNights">Min nights</Label>
              <Input id="minNights" type="number" min={1} value={form.minNights} onChange={(e) => set('minNights', parseInt(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-in / Check-out</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkInFrom">Check-in from</Label>
              <Input id="checkInFrom" value={form.checkInFrom} onChange={(e) => set('checkInFrom', e.target.value)} placeholder="14:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkInTo">Check-in to</Label>
              <Input id="checkInTo" value={form.checkInTo} onChange={(e) => set('checkInTo', e.target.value)} placeholder="20:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutFrom">Check-out from</Label>
              <Input id="checkOutFrom" value={form.checkOutFrom} onChange={(e) => set('checkOutFrom', e.target.value)} placeholder="08:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTo">Check-out to</Label>
              <Input id="checkOutTo" value={form.checkOutTo} onChange={(e) => set('checkOutTo', e.target.value)} placeholder="10:00" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">iCal Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="icalUrl">Booking.com iCal URL</Label>
            <Input id="icalUrl" type="url" value={form.icalUrl} onChange={(e) => set('icalUrl', e.target.value)} placeholder="https://admin.booking.com/..." />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="rounded"
          />
          Active
        </label>
      </div>
    </form>
  )
}
