'use client'

import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'

const syncStatusColor: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  SYNCING: 'bg-blue-100 text-blue-800',
  SUCCESS: 'bg-green-100 text-green-800',
  ERROR: 'bg-red-100 text-red-800',
}

export function IcalStatusStrip() {
  const { data, isLoading, refetch } = trpc.admin.ical.status.useQuery()
  const syncMutation = trpc.admin.ical.sync.useMutation({
    onSuccess: () => {
      // Refetch status after a short delay to show updated sync state
      setTimeout(() => refetch(), 2000)
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">iCal Sync Status</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate({})}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-3 w-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync All
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No properties with iCal configured</p>
        ) : (
          <div className="space-y-3">
            {data.map((p) => (
              <div key={p.propertyId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.propertyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.icalUrl ? `${p.externalBlockCount} blocks imported` : 'No iCal URL'}
                    {p.icalLastSyncedAt && (
                      <> · Last sync: {new Date(p.icalLastSyncedAt).toLocaleString()}</>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className={syncStatusColor[p.icalSyncStatus]}>
                  {p.icalSyncStatus}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
