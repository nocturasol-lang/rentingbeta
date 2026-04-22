'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Scroll-reveal motion ──────────────────────────────────────────

function useInView<T extends Element = HTMLDivElement>(threshold = 0.15) {
  const ref = React.useRef<T | null>(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true)
            io.disconnect()
          }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

export function Reveal({
  children,
  delay = 0,
  dy = 22,
  duration = 700,
  className,
  style,
}: {
  children: React.ReactNode
  delay?: number
  dy?: number
  duration?: number
  className?: string
  style?: React.CSSProperties
}) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : `translateY(${dy}px)`,
        transition: `opacity ${duration}ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform ${duration}ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function RevealText({
  text,
  stagger = 55,
  delay = 0,
  size = 32,
  color,
  italic = false,
  weight = 400,
  className,
  style,
}: {
  text: string
  stagger?: number
  delay?: number
  size?: number
  color?: string
  italic?: boolean
  weight?: number
  className?: string
  style?: React.CSSProperties
}) {
  const [ref, inView] = useInView()
  const words = text.split(' ')
  return (
    <div
      ref={ref}
      className={cn('cosy-display', className)}
      style={{
        fontSize: size,
        color,
        fontWeight: weight,
        fontStyle: italic ? 'italic' : 'normal',
        ...style,
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'top',
            paddingBottom: '0.1em',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: inView ? 'translateY(0)' : 'translateY(110%)',
              transition: `transform 800ms cubic-bezier(.2,.8,.2,1) ${delay + i * stagger}ms`,
              willChange: 'transform',
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </div>
  )
}

// ─── Typography ──────────────────────────────────────────

export function Eyebrow({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('cosy-sans', className)}
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 2.2,
        textTransform: 'uppercase',
        color: 'var(--cosy-accent)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Display({
  children,
  size = 32,
  color,
  italic = false,
  weight = 400,
  className,
  style,
}: {
  children: React.ReactNode
  size?: number
  color?: string
  italic?: boolean
  weight?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('cosy-display', className)}
      style={{
        fontSize: size,
        fontWeight: weight,
        color: color ?? 'var(--cosy-ink)',
        fontStyle: italic ? 'italic' : 'normal',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Body({
  children,
  size = 13,
  color,
  weight = 400,
  className,
  style,
}: {
  children: React.ReactNode
  size?: number
  color?: string
  weight?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('cosy-sans', className)}
      style={{
        fontSize: size,
        fontWeight: weight,
        color: color ?? 'var(--cosy-ink-soft)',
        lineHeight: 1.55,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Label({
  children,
  color,
  className,
  style,
}: {
  children: React.ReactNode
  color?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('cosy-sans', className)}
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: color ?? 'var(--cosy-ink-mute)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Button ──────────────────────────────────────────

type BtnProps = {
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'plain'
  size?: 'md' | 'sm'
  wide?: boolean
  pill?: boolean
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}

export function Btn({
  children,
  variant = 'plain',
  size = 'md',
  wide = false,
  pill = true,
  style,
  className,
  onClick,
  type = 'button',
}: BtnProps) {
  const [hover, setHover] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const small = size === 'sm'
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--font-sans)',
    fontSize: small ? 11 : 12,
    fontWeight: 600,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    padding: small ? '10px 18px' : '16px 26px',
    border: 'none',
    cursor: 'pointer',
    width: wide ? '100%' : undefined,
    borderRadius: pill ? 'var(--cosy-r-full)' : 'var(--cosy-r1)',
    transition:
      'transform 180ms cubic-bezier(.34,1.56,.64,1), box-shadow 220ms, background 180ms',
    transform: pressed ? 'scale(0.96)' : hover ? 'scale(1.02)' : 'scale(1)',
    willChange: 'transform',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--cosy-accent)',
      color: '#fff',
      boxShadow: hover
        ? '0 10px 24px -6px rgba(90,90,86,.55), 0 2px 4px rgba(0,0,0,.08)'
        : '0 4px 14px -4px rgba(90,90,86,.33), 0 1px 2px rgba(0,0,0,.06)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--cosy-ink)',
      border: '1.5px solid var(--cosy-ink)',
    },
    plain: {
      background: 'var(--cosy-paper)',
      color: 'var(--cosy-ink)',
      boxShadow: hover
        ? '0 6px 18px -6px rgba(43,29,21,.22)'
        : '0 1px 3px rgba(43,29,21,.08)',
    },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setPressed(false)
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className={className}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}

// ─── Photo (fallback placeholder when no image) ──────────────────────────────────────────

type Tone = 'warm' | 'dusk' | 'sand' | 'sage' | 'sky'

export function Photo({
  label,
  ratio = '4/3',
  tone = 'warm',
  radius = 'var(--cosy-r2)',
  src,
  alt,
  className,
  style,
  fill = false,
  sizes,
}: {
  label?: string
  ratio?: string
  tone?: Tone
  radius?: string | number
  src?: string | null
  alt?: string
  className?: string
  style?: React.CSSProperties
  fill?: boolean
  sizes?: string
}) {
  const backgrounds: Record<Tone, string> = {
    warm: 'linear-gradient(135deg, #B8B8B3 0%, #8A8A87 50%, #5A5A56 100%)',
    dusk: 'linear-gradient(160deg, #2F2F2D 0%, #454542 50%, #6A6A65 100%)',
    sand: 'linear-gradient(135deg, #D0D0CA 0%, #A8A8A3 100%)',
    sage: 'linear-gradient(135deg, #C4C4BE 0%, #96968F 100%)',
    sky: 'linear-gradient(160deg, #BEC4C8 0%, #8E9498 100%)',
  }
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: fill ? undefined : ratio,
        height: fill ? '100%' : undefined,
        background: src ? undefined : backgrounds[tone],
        overflow: 'hidden',
        borderRadius: radius,
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ''}
          sizes={sizes}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(100% 60% at 40% 25%, rgba(255,240,220,0.28), transparent 65%)',
            }}
          />
          {label && (
            <div
              className="cosy-mono"
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                fontSize: 9,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                background: 'rgba(0,0,0,0.28)',
                padding: '3px 8px',
                borderRadius: 999,
                backdropFilter: 'blur(4px)',
              }}
            >
              {label}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Chip ──────────────────────────────────────────

export function Chip({
  children,
  tone = 'neutral',
  className,
  style,
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'dark' | 'sage' | 'cream'
  className?: string
  style?: React.CSSProperties
}) {
  const tones: Record<string, React.CSSProperties> = {
    neutral: { background: 'var(--cosy-peach)', color: 'var(--cosy-ink)' },
    dark: { background: 'var(--cosy-ink)', color: '#fff' },
    sage: { background: 'rgba(196,196,190,0.6)', color: 'var(--cosy-ink)' },
    cream: {
      background: 'var(--cosy-cream-soft)',
      color: 'var(--cosy-ink-soft)',
      border: '1px solid var(--cosy-line)',
    },
  }
  return (
    <div
      className={cn('cosy-sans', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 'var(--cosy-r-full)',
        fontSize: 11,
        fontWeight: 500,
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── CountUp ──────────────────────────────────────────

export function CountUp({
  to,
  duration = 900,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [value, setValue] = React.useState(0)
  React.useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(to * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setValue(to)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])
  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  )
}

// ─── Star ──────────────────────────────────────────

export function Star({
  size = 10,
  color = 'var(--cosy-accent)',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill={color}
      style={{ flexShrink: 0 }}
    >
      <polygon points="5,0.5 6.2,3.6 9.5,3.8 6.9,5.9 7.8,9 5,7.3 2.2,9 3.1,5.9 0.5,3.8 3.8,3.6" />
    </svg>
  )
}
