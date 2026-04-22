'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  BarChart3,
  Wrench,
  Users,
  FileText,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/guests', label: 'Guests', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/operations', label: 'Operations', icon: Wrench },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
]

export function AdminSidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: collapsed ? 64 : 232,
        background: 'var(--cosy-paper)',
        borderRight: '1px solid var(--cosy-line)',
        transition: 'width 220ms cubic-bezier(.2,.7,.2,1)',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: 80,
          padding: collapsed ? '0 12px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--cosy-line-soft)',
        }}
      >
        {!collapsed && (
          <Link
            href="/admin/dashboard"
            style={{
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              overflow: 'hidden',
            }}
          >
            <span
              className="cosy-sans"
              style={{
                fontSize: 9,
                letterSpacing: 2.4,
                textTransform: 'uppercase',
                color: 'var(--cosy-ink-mute)',
                fontWeight: 600,
              }}
            >
              Admin · Est. 2018
            </span>
            <span
              className="cosy-display"
              style={{
                fontSize: 18,
                fontStyle: 'italic',
                fontWeight: 500,
                color: 'var(--cosy-ink)',
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Georgia&apos;s Rooms
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--cosy-r1)',
            border: 'none',
            background: 'transparent',
            color: 'var(--cosy-ink-mute)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className="cosy-sans"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--cosy-r1)',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? 'var(--cosy-ink)' : 'var(--cosy-ink-mute)',
                background: isActive ? 'var(--cosy-peach-soft)' : 'transparent',
                transition: 'background 140ms, color 140ms',
                position: 'relative',
              }}
            >
              {isActive && !collapsed && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    borderRadius: 2,
                    background: 'var(--cosy-ink)',
                  }}
                />
              )}
              <item.icon
                className="h-4 w-4 shrink-0"
                style={{ color: isActive ? 'var(--cosy-ink)' : 'var(--cosy-ink-mute)' }}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer — user + sign out */}
      <div
        style={{
          borderTop: '1px solid var(--cosy-line-soft)',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {!collapsed && userName && (
          <div
            style={{
              padding: '8px 14px 4px',
              color: 'var(--cosy-ink-mute)',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userName}
          </div>
        )}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="cosy-sans"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '10px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--cosy-r1)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'var(--cosy-ink-mute)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
