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

// ─── Split view (list on left, detail on right) ──────────────────────────────

export function SplitView({
  list,
  detail,
  hasDetail,
}: {
  list: React.ReactNode
  detail: React.ReactNode
  hasDetail: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hasDetail ? 'minmax(0, 1fr) minmax(0, 1.2fr)' : 'minmax(0, 1fr)',
        gap: 16,
        alignItems: 'start',
        transition: 'grid-template-columns 240ms cubic-bezier(.2,.7,.2,1)',
      }}
    >
      <div style={{ minWidth: 0 }}>{list}</div>
      {hasDetail && <div style={{ minWidth: 0, position: 'sticky', top: 16 }}>{detail}</div>}
    </div>
  )
}

// ─── Tabs ──────────────────────────────

export function Tabs({
  items,
  active,
  onChange,
  counts,
}: {
  items: Array<{ value: string; label: string }>
  active: string
  onChange: (value: string) => void
  counts?: Record<string, number>
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 4,
        background: 'var(--cosy-paper)',
        borderRadius: 'var(--cosy-r-full)',
        border: '1px solid var(--cosy-line)',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {items.map((item) => {
        const isActive = item.value === active
        const count = counts?.[item.value]
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className="cosy-sans"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 'var(--cosy-r-full)',
              border: 'none',
              background: isActive ? 'var(--cosy-ink)' : 'transparent',
              color: isActive ? '#fff' : 'var(--cosy-ink-mute)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              transition: 'background 160ms, color 160ms',
            }}
          >
            {item.label}
            {count !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 7px',
                  borderRadius: 999,
                  background: isActive ? 'rgba(255,255,255,0.16)' : 'var(--cosy-peach-soft)',
                  color: isActive ? '#fff' : 'var(--cosy-ink-soft)',
                  letterSpacing: 0,
                }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Icon/ghost buttons ──────────────────────────────

export function IconButton({
  onClick,
  ariaLabel,
  children,
  disabled,
  variant = 'outline',
}: {
  onClick?: () => void
  ariaLabel: string
  children: React.ReactNode
  disabled?: boolean
  variant?: 'outline' | 'solid'
}) {
  const solid = variant === 'solid'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 'var(--cosy-r-full)',
        border: solid ? 'none' : '1px solid var(--cosy-line)',
        background: solid ? 'var(--cosy-ink)' : 'var(--cosy-paper)',
        color: solid ? '#fff' : 'var(--cosy-ink)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

export function PillButton({
  onClick,
  children,
  variant = 'outline',
  size = 'sm',
  disabled,
  type = 'button',
  tone,
}: {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'outline' | 'solid' | 'ghost'
  size?: 'xs' | 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  tone?: 'neutral' | 'danger'
}) {
  const padding = size === 'xs' ? '6px 12px' : size === 'sm' ? '8px 16px' : '12px 22px'
  const fontSize = size === 'xs' ? 10 : size === 'sm' ? 11 : 12
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontFamily: 'var(--font-sans)',
    fontSize,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    padding,
    border: 'none',
    borderRadius: 'var(--cosy-r-full)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'background 160ms, color 160ms, box-shadow 160ms',
  }
  const danger = tone === 'danger'
  const variants: Record<string, React.CSSProperties> = {
    solid: {
      background: danger ? '#9b2c2c' : 'var(--cosy-ink)',
      color: '#fff',
    },
    outline: {
      background: 'var(--cosy-paper)',
      color: danger ? '#9b2c2c' : 'var(--cosy-ink)',
      border: `1px solid ${danger ? '#e5cdcd' : 'var(--cosy-line)'}`,
    },
    ghost: {
      background: 'transparent',
      color: danger ? '#9b2c2c' : 'var(--cosy-ink-mute)',
    },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  )
}

// ─── Empty state ──────────────────────────────

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--cosy-ink-mute)',
      }}
    >
      <div
        className="cosy-display"
        style={{
          fontStyle: 'italic',
          fontSize: 22,
          color: 'var(--cosy-ink)',
          marginBottom: body ? 8 : 0,
        }}
      >
        {title}
      </div>
      {body && (
        <div
          className="cosy-sans"
          style={{ fontSize: 13, color: 'var(--cosy-ink-mute)', marginBottom: action ? 18 : 0 }}
        >
          {body}
        </div>
      )}
      {action}
    </div>
  )
}
