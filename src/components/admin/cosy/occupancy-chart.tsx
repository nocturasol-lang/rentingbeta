'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type OccupancyPoint = {
  date: string // "Apr 22"
  iso: string // "2026-04-22"
  booked: number
  total: number
}

export function OccupancyChart({
  data,
  height = 180,
}: {
  data: OccupancyPoint[]
  height?: number
}) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cosy-occupancy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cosy-accent)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--cosy-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--cosy-ink-mute)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--cosy-line)' }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: 'var(--cosy-ink-mute)' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ stroke: 'var(--cosy-line)', strokeDasharray: '3 3' }}
            contentStyle={{
              background: 'var(--cosy-paper)',
              border: '1px solid var(--cosy-line)',
              borderRadius: 10,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--cosy-ink)',
              padding: '8px 12px',
              boxShadow: '0 6px 18px -6px rgba(31,31,30,0.2)',
            }}
            labelStyle={{
              color: 'var(--cosy-ink-mute)',
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
            formatter={(value, _name, entry) => {
              const payload = (entry as { payload?: OccupancyPoint })?.payload
              const total = payload?.total ?? 0
              return [`${value} of ${total} booked`, 'Rooms']
            }}
          />
          <Area
            type="monotone"
            dataKey="booked"
            stroke="var(--cosy-accent)"
            strokeWidth={1.6}
            fill="url(#cosy-occupancy)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--cosy-ink)', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
