'use client'

import { RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import {
  Panel,
  PanelTitle,
  StatusPill,
  SyncStatusTone,
} from '@/components/admin/cosy/primitives'

export function IcalStatusStrip() {
  const { data, isLoading, refetch } = trpc.admin.ical.status.useQuery()
  const syncMutation = trpc.admin.ical.sync.useMutation({
    onSuccess: () => {
      setTimeout(() => refetch(), 2000)
    },
  })

  return (
    <Panel>
      <PanelTitle
        action={
          <button
            type="button"
            onClick={() => syncMutation.mutate({})}
            disabled={syncMutation.isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--cosy-r-full)',
              background: 'var(--cosy-ink)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              border: 'none',
              cursor: syncMutation.isPending ? 'wait' : 'pointer',
              opacity: syncMutation.isPending ? 0.7 : 1,
            }}
          >
            <RefreshCw
              className="h-3 w-3"
              style={{ animation: syncMutation.isPending ? 'spin 1s linear infinite' : undefined }}
            />
            Sync all
          </button>
        }
      >
        iCal sync
      </PanelTitle>

      {isLoading ? (
        <div className="cosy-sans" style={{ fontSize: 13, color: 'var(--cosy-ink-mute)' }}>
          Loading…
        </div>
      ) : !data || data.length === 0 ? (
        <div className="cosy-sans" style={{ fontSize: 13, color: 'var(--cosy-ink-mute)' }}>
          No properties with iCal configured.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((p) => (
            <div
              key={p.propertyId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--cosy-line-soft)',
              }}
            >
              <div>
                <div
                  className="cosy-sans"
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--cosy-ink)' }}
                >
                  {p.propertyName}
                </div>
                <div
                  className="cosy-sans"
                  style={{ fontSize: 11, color: 'var(--cosy-ink-mute)', marginTop: 2 }}
                >
                  {p.icalUrl ? `${p.externalBlockCount} blocks imported` : 'No iCal URL'}
                  {p.icalLastSyncedAt && (
                    <> · Synced {new Date(p.icalLastSyncedAt).toLocaleString()}</>
                  )}
                </div>
              </div>
              <StatusPill tone={SyncStatusTone(p.icalSyncStatus)}>
                {p.icalSyncStatus}
              </StatusPill>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
