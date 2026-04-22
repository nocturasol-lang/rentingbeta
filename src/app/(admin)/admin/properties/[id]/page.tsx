'use client'

import * as React from 'react'
import Link from 'next/link'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import {
  EmptyState,
  PageHeader,
  Panel,
  PillButton,
  StatusPill,
  Tabs,
} from '@/components/admin/cosy/primitives'
import { PropertyForm } from './property-form'
import { PhotoManager } from './photo-manager'
import { ChannelsPanel } from './channels'

// Re-export primitives helper label since primitives.tsx doesn't export a type Label helper
type Tab = 'essentials' | 'photos' | 'channels'

function extractTitle(name: string): string {
  const match = name.match(/#(\d+)/)
  return match ? `Cosy Rooms #${match[1]}` : name
}

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [tab, setTab] = React.useState<Tab>('essentials')
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const { data: property, isLoading, refetch } = trpc.admin.properties.getById.useQuery({ id })

  const updateMutation = trpc.admin.properties.update.useMutation({
    onSuccess: () => {
      setSaveStatus('saved')
      window.setTimeout(() => setSaveStatus('idle'), 1800)
      refetch()
    },
    onError: () => setSaveStatus('error'),
  })

  if (isLoading) {
    return (
      <div style={{ padding: '32px 40px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <Panel>
          <div className="cosy-sans" style={{ fontSize: 13, color: 'var(--cosy-ink-mute)' }}>
            Loading…
          </div>
        </Panel>
      </div>
    )
  }

  if (!property) {
    return (
      <div style={{ padding: '32px 40px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <Panel>
          <EmptyState
            title="Property not found"
            body="It may have been removed."
            action={
              <Link href="/admin/properties" style={{ textDecoration: 'none' }}>
                <PillButton variant="outline">Back to apartments</PillButton>
              </Link>
            }
          />
        </Panel>
      </div>
    )
  }

  const title = extractTitle(property.name)

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/admin/properties" style={{ textDecoration: 'none' }}>
          <span
            className="cosy-sans"
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: 'var(--cosy-ink-mute)',
            }}
          >
            Apartments
          </span>
        </Link>
        <span style={{ color: 'var(--cosy-ink-mute)', fontSize: 11 }}>/</span>
        <span
          className="cosy-sans"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            color: 'var(--cosy-ink)',
          }}
        >
          {title}
        </span>
      </div>

      <PageHeader
        eyebrow={property.isActive ? 'Active listing' : 'Inactive'}
        title={title}
        subtitle={property.address}
      >
        <StatusPill tone={property.isActive ? 'success' : 'neutral'}>
          {property.isActive ? 'Published' : 'Hidden'}
        </StatusPill>
      </PageHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Tabs
          items={[
            { value: 'essentials', label: 'Essentials' },
            { value: 'photos', label: 'Photos' },
            { value: 'channels', label: 'Channels' },
          ]}
          active={tab}
          onChange={(v) => setTab(v as Tab)}
          counts={{
            photos: property.images.length,
          }}
        />
        {saveStatus !== 'idle' && (
          <div
            className="cosy-sans"
            style={{
              fontSize: 11,
              color:
                saveStatus === 'error'
                  ? '#9b2c2c'
                  : saveStatus === 'saved'
                    ? '#3f7a4f'
                    : 'var(--cosy-ink-mute)',
            }}
          >
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
          </div>
        )}
      </div>

      {tab === 'essentials' && (
        <PropertyForm
          property={property}
          onSubmit={(data) => {
            setSaveStatus('saving')
            updateMutation.mutate({ id, ...data })
          }}
          isPending={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}

      {tab === 'photos' && (
        <PhotoManager
          propertyId={id}
          images={property.images}
          onUpdate={() => refetch()}
        />
      )}

      {tab === 'channels' && (
        <ChannelsPanel
          propertyId={id}
          icalUrl={property.icalUrl}
          icalSyncStatus={property.icalSyncStatus}
          icalLastSyncedAt={property.icalLastSyncedAt as Date | string | null}
          externalBlockCount={property._count.externalBlocks}
          platformFeePercent={Number(property.platformFeePercent)}
          onUpdate={() => refetch()}
        />
      )}

      <div style={{ marginTop: 24 }}>
        <PillButton
          variant="ghost"
          onClick={() => router.push('/admin/properties')}
        >
          ← Back to apartments
        </PillButton>
      </div>
    </div>
  )
}
