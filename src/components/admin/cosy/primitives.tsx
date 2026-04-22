'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Shared admin UI primitives in the cosy style.
 * Denser than the public site — more data per screen — but built from
 * the same CSS variables so the two stay consistent.
 */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 28,
        flexWrap: 'wrap',
      }}
    >
      <div>
        {eyebrow && (
          <div
            className="cosy-sans"
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'var(--cosy-accent)',
              marginBottom: 8,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className="cosy-display"
          style={{
            fontStyle: 'italic',
            fontSize: 34,
            fontWeight: 500,
            color: 'var(--cosy-ink)',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <div
            className="cosy-sans"
            style={{
              fontSize: 13,
              color: 'var(--cosy-ink-mute)',
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {children && <div style={{ display: 'flex', gap: 10 }}>{children}</div>}
    </div>
  )
}

export function Panel({
  children,
  className,
  style,
  padding = 24,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  padding?: number
}) {
  return (
    <div
      className={cn(className)}
      style={{
        background: 'var(--cosy-paper)',
        borderRadius: 'var(--cosy-r2)',
        padding,
        boxShadow: '0 1px 3px rgba(31,31,30,.05)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PanelTitle({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <div
        className="cosy-sans"
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: 'var(--cosy-ink-mute)',
        }}
      >
        {children}
      </div>
      {action}
    </div>
  )
}

export function Metric({
  label,
  value,
  delta,
  icon,
}: {
  label: string
  value: string | number
  delta?: { value: string; tone?: 'up' | 'down' | 'neutral' }
  icon?: React.ReactNode
}) {
  const deltaColor =
    delta?.tone === 'up'
      ? '#3f7a4f'
      : delta?.tone === 'down'
        ? '#9b2c2c'
        : 'var(--cosy-ink-mute)'
  return (
    <Panel padding={22}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div
          className="cosy-sans"
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            color: 'var(--cosy-ink-mute)',
          }}
        >
          {label}
        </div>
        {icon && <div style={{ color: 'var(--cosy-ink-mute)' }}>{icon}</div>}
      </div>
      <div
        className="cosy-display"
        style={{
          fontStyle: 'italic',
          fontSize: 32,
          color: 'var(--cosy-ink)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          className="cosy-sans"
          style={{
            fontSize: 11,
            color: deltaColor,
            marginTop: 8,
            fontWeight: 500,
          }}
        >
          {delta.value}
        </div>
      )}
    </Panel>
  )
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info'
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: 'var(--cosy-peach-soft)', fg: 'var(--cosy-ink-soft)' },
    success: { bg: '#E5EFE7', fg: '#3f7a4f' },
    warn: { bg: '#F3EBD8', fg: '#8a6a2c' },
    danger: { bg: '#F4E1E1', fg: '#9b2c2c' },
    info: { bg: '#E1EBF1', fg: '#2c5f8a' },
  }
  const t = tones[tone]
  return (
    <span
      className="cosy-sans"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 'var(--cosy-r-full)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        background: t.bg,
        color: t.fg,
      }}
    >
      {children}
    </span>
  )
}

export function bookingStatusTone(
  status: string
): 'neutral' | 'success' | 'warn' | 'danger' | 'info' {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'PENDING') return 'warn'
  if (status === 'FAILED') return 'danger'
  if (status === 'CANCELLING') return 'warn'
  if (status === 'CANCELLED') return 'neutral'
  return 'neutral'
}

export function SyncStatusTone(
  status: string
): 'neutral' | 'success' | 'warn' | 'danger' | 'info' {
  if (status === 'SUCCESS') return 'success'
  if (status === 'SYNCING') return 'info'
  if (status === 'ERROR') return 'danger'
  return 'neutral'
}
