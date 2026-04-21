'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ManualBookingFormProps {
  properties: Array<{ id: string; name: string }>
  onSuccess: () => void
}

export function ManualBookingForm({ properties, onSuccess }: ManualBookingFormProps) {
  const [form, setForm] = useState({
    propertyId: '',
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: 1,
    note: '',
  })

  const mutation = trpc.admin.bookings.createManual.useMutation({
    onSuccess,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      ...form,
      guestCount: form.guestCount,
      guestPhone: form.guestPhone || undefined,
      note: form.note || undefined,
    })
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Property</Label>
        <Select value={form.propertyId} onValueChange={(v) => { if (v) set('propertyId', v) }}>
          <SelectTrigger>
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="mb-checkin">Check-in</Label>
          <Input id="mb-checkin" type="date" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mb-checkout">Check-out</Label>
          <Input id="mb-checkout" type="date" min={form.checkIn || undefined} value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mb-name">Guest Name</Label>
        <Input id="mb-name" value={form.guestName} onChange={(e) => set('guestName', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="mb-email">Email</Label>
          <Input id="mb-email" type="email" value={form.guestEmail} onChange={(e) => set('guestEmail', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mb-phone">Phone</Label>
          <Input id="mb-phone" type="tel" value={form.guestPhone} onChange={(e) => set('guestPhone', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mb-guests">Guest Count</Label>
        <Input id="mb-guests" type="number" min={1} value={form.guestCount} onChange={(e) => set('guestCount', parseInt(e.target.value))} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mb-note">Note</Label>
        <Input id="mb-note" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Cash payment, phone booking, etc." />
      </div>

      {mutation.error && (
        <p className="text-sm text-destructive">{mutation.error.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending || !form.propertyId}>
        {mutation.isPending ? 'Creating...' : 'Create Booking'}
      </Button>
    </form>
  )
}
