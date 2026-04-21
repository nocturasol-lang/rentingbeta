'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { data, isLoading } = trpc.admin.calendar.getRange.useQuery({ from, to })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  function getEventsForDay(dayStr: string) {
    if (!data) return []
    const events: Array<{
      label: string
      color: string
      type: string
      propertyName: string
      status?: string
    }> = []

    for (const property of data) {
      for (const event of property.events) {
        // Compare as strings to avoid timezone issues
        if (dayStr >= event.checkIn && dayStr < event.checkOut) {
          events.push({
            label: 'label' in event ? event.label : '',
            color: property.color,
            type: event.type,
            propertyName: property.propertyName,
            status: 'status' in event ? (event.status as string) : undefined,
          })
        }
      }
    }

    return events
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Property legend */}
      {data && (
        <div className="flex flex-wrap gap-3">
          {data.map((p) => (
            <div key={p.propertyId} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs text-muted-foreground">{p.propertyName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading calendar...</p>
            </div>
          ) : (
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const events = getEventsForDay(dayStr)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = dayStr === format(new Date(), 'yyyy-MM-dd')

                  return (
                    <div
                      key={dayStr}
                      className={cn(
                        'min-h-[80px] border-b border-r p-1',
                        !isCurrentMonth && 'bg-muted/30'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                          isToday && 'bg-primary text-primary-foreground font-bold',
                          !isCurrentMonth && 'text-muted-foreground'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {events.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className="truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white"
                            style={{ backgroundColor: event.color }}
                            title={`${event.propertyName}: ${event.label} (${event.type})`}
                          >
                            {event.label}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{events.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
