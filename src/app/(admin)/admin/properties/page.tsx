'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, ExternalLink, RefreshCw, Copy } from 'lucide-react'

export default function PropertiesPage() {
  const { data: properties, isLoading } = trpc.admin.properties.list.useQuery()
  const syncMutation = trpc.admin.ical.sync.useMutation()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Properties</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading properties...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {properties?.map((property) => (
            <Card key={property.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{property.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {property.bedrooms} bed · {property.bathrooms} bath · {property.maxGuests} guests
                      {property.size ? ` · ${property.size} m²` : ''}
                    </p>
                  </div>
                  <Badge variant={property.isActive ? 'default' : 'secondary'}>
                    {property.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Price/night</p>
                    <p className="font-medium">€{(property.pricePerNightCents / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Cleaning fee</p>
                    <p className="font-medium">€{(property.cleaningFeeCents / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Bookings</p>
                    <p className="font-medium">{property._count.bookings}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">External blocks</p>
                    <p className="font-medium">{property._count.externalBlocks}</p>
                  </div>
                </div>

                {/* iCal export URL */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      Export: <code className="text-[10px]">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/ical/${property.id}`}</code>
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/ical/${property.id}`)}
                      title="Copy export URL"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* iCal sync */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="text-xs text-muted-foreground">
                    iCal Import: {property.icalUrl ? (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {property.icalSyncStatus}
                      </Badge>
                    ) : (
                      <span>Not configured</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {property.icalUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => syncMutation.mutate({ propertyId: property.id })}
                        disabled={syncMutation.isPending}
                        title="Sync iCal"
                      >
                        <RefreshCw className={`h-3 w-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    <Link href={`/admin/properties/${property.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
