'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, CheckCircle2, Circle, LoaderCircle } from 'lucide-react'

const statusIcon: Record<string, React.ReactNode> = {
  PENDING: <Circle className="h-4 w-4 text-amber-500" />,
  IN_PROGRESS: <LoaderCircle className="h-4 w-4 text-blue-500" />,
  DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

const priorityColor: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-800 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Cleaning tasks, maintenance & room readiness
        </p>
      </div>

      <Tabs defaultValue="cleaning">
        <TabsList>
          <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="readiness">Room Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="cleaning" className="space-y-4">
          <CleaningTab />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceTab />
        </TabsContent>

        <TabsContent value="readiness">
          <ReadinessTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CleaningTab() {
  const { data: properties } = trpc.admin.properties.list.useQuery()
  const { data: tasks, refetch } = trpc.admin.operations.cleaningTasks.useQuery()
  const updateStatus = trpc.admin.operations.updateCleaningTaskStatus.useMutation({
    onSuccess: () => void refetch(),
  })
  const create = trpc.admin.operations.createCleaningTask.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)

  const cycleStatus = (id: string, current: string) => {
    const next =
      current === 'PENDING'
        ? 'IN_PROGRESS'
        : current === 'IN_PROGRESS'
          ? 'DONE'
          : 'PENDING'
    updateStatus.mutate({ id, status: next as 'PENDING' | 'IN_PROGRESS' | 'DONE' })
  }

  const filtered = tasks?.filter(
    (t) => statusFilter === 'ALL' || t.status === statusFilter
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-xs">Filter</Label>
          <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors h-8 text-xs">
            <Plus className="h-4 w-4" /> Add Task
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Cleaning Task</DialogTitle>
            </DialogHeader>
            <CleaningTaskForm
              properties={properties ?? []}
              onSubmit={(data) => {
                create.mutate(data)
                setDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {filtered?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No cleaning tasks
          </p>
        )}
        {filtered?.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() =>
              cycleStatus(task.id, task.status)
            }
          >
            <div className="flex items-center gap-3">
              {statusIcon[task.status]}
              <div>
                <p className="text-sm font-medium">{task.property.name}</p>
                <p className="text-xs text-muted-foreground">
                  {task.date} · {task.type}
                  {task.assignedTo ? ` · ${task.assignedTo}` : ''}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                task.status === 'DONE'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
              }
            >
              {task.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function CleaningTaskForm({
  properties,
  onSubmit,
}: {
  properties: Array<{ id: string; name: string }>
  onSubmit: (data: {
    propertyId: string
    date: string
    type: 'TURNOVER' | 'DEEP_CLEAN' | 'MAINTENANCE'
    assignedTo?: string
    notes?: string
  }) => void
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState<'TURNOVER' | 'DEEP_CLEAN' | 'MAINTENANCE'>('TURNOVER')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-3">
      <div>
        <Label>Property</Label>
        <Select value={propertyId} onValueChange={(v: string | null) => { if (v) setPropertyId(v) }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select
          value={type}
          onValueChange={(v: string | null) => { if (v) setType(v as 'TURNOVER' | 'DEEP_CLEAN' | 'MAINTENANCE') }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TURNOVER">Turnover</SelectItem>
            <SelectItem value="DEEP_CLEAN">Deep Clean</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance Clean</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Assigned To</Label>
        <Input
          placeholder="Cleaner name"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        />
      </div>
      <div>
        <Label>Notes</Label>
        <Input
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button
        className="w-full"
        onClick={() => onSubmit({ propertyId, date, type, assignedTo: assignedTo || undefined, notes: notes || undefined })}
      >
        Create Task
      </Button>
    </div>
  )
}

function MaintenanceTab() {
  const { data: properties } = trpc.admin.properties.list.useQuery()
  const { data: issues, refetch } = trpc.admin.operations.maintenanceIssues.useQuery()
  const update = trpc.admin.operations.updateMaintenanceIssue.useMutation({
    onSuccess: () => void refetch(),
  })
  const create = trpc.admin.operations.createMaintenanceIssue.useMutation({
    onSuccess: () => void refetch(),
  })
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = issues?.filter(
    (i) => statusFilter === 'ALL' || i.status === statusFilter
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-xs">Filter</Label>
          <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors h-8 text-xs">
            <Plus className="h-4 w-4" /> Report Issue
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Maintenance Issue</DialogTitle>
            </DialogHeader>
            <MaintenanceForm
              properties={properties ?? []}
              onSubmit={(data) => {
                create.mutate(data)
                setDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {filtered?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No maintenance issues
          </p>
        )}
        {filtered?.map((issue) => (
          <div
            key={issue.id}
            className={`rounded-lg border p-3 ${
              issue.priority === 'URGENT' ? 'border-l-4 border-l-red-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{issue.title}</p>
                <p className="text-xs text-muted-foreground">
                  {issue.property.name} · {issue.priority}
                  {issue.assignedTo ? ` · ${issue.assignedTo}` : ''} · Reported by{' '}
                  {issue.reportedBy}
                </p>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline" className={priorityColor[issue.priority]}>
                  {issue.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    issue.status === 'RESOLVED'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : issue.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                  }
                >
                  {issue.status}
                </Badge>
              </div>
            </div>
            {issue.resolvedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Resolved: {issue.resolvedAt}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MaintenanceForm({
  properties,
  onSubmit,
}: {
  properties: Array<{ id: string; name: string }>
  onSubmit: (data: {
    propertyId: string
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'URGENT'
    reportedBy: string
    assignedTo?: string
    notes?: string
  }) => void
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'URGENT'>('MEDIUM')
  const [reportedBy, setReportedBy] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-3">
      <div>
        <Label>Property</Label>
        <Select value={propertyId} onValueChange={(v: string | null) => { if (v) setPropertyId(v) }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input placeholder="e.g. Broken AC in living room" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          placeholder="Describe the issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label>Priority</Label>
        <Select
          value={priority}
          onValueChange={(v: string | null) => { if (v) setPriority(v as 'LOW' | 'MEDIUM' | 'URGENT') }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Reported By</Label>
        <Input placeholder="Your name" value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} />
      </div>
      <div>
        <Label>Assigned To</Label>
        <Input placeholder="Optional" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
      </div>
      <div>
        <Label>Notes</Label>
        <Input placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button
        className="w-full"
        disabled={!title || !reportedBy}
        onClick={() =>
          onSubmit({
            propertyId,
            title,
            description,
            priority,
            reportedBy,
            assignedTo: assignedTo || undefined,
            notes: notes || undefined,
          })
        }
      >
        Create Issue
      </Button>
    </div>
  )
}

function ReadinessTab() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: properties } = trpc.admin.properties.list.useQuery()
  const { data, refetch } = trpc.admin.operations.roomReadiness.useQuery({
    from: today,
    to: today,
  })
  const { data: tasks } = trpc.admin.operations.cleaningTasks.useQuery()
  const create = trpc.admin.operations.createCleaningTask.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Room Readiness — {format(new Date(), 'EEEE, d MMMM yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.map((room) => (
          <div
            key={room.propertyId}
            className={`rounded-lg border p-4 ${
              !room.ready ? 'border-l-4 border-l-amber-500 bg-amber-50/50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{room.propertyName}</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {room.checkout && (
                    <p>
                      Checkout: <span className="font-medium">{room.checkout.guestName}</span>
                    </p>
                  )}
                  {room.checkin && (
                    <p>
                      Check-in: <span className="font-medium">{room.checkin.guestName}</span>
                    </p>
                  )}
                  {!room.checkout && !room.checkin && (
                    <p>No activity today</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {room.needsCleaning && (
                  <Badge
                    variant="outline"
                    className={
                      room.isCleaned
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }
                  >
                    {room.isCleaned ? 'Cleaned' : 'Needs cleaning'}
                  </Badge>
                )}
                {room.needsCleaning && !room.isCleaned && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => {
                      const existingTasks = tasks?.filter(
                        (t) =>
                          t.propertyId === room.propertyId &&
                          t.date === today &&
                          t.status !== 'DONE'
                      )
                      if (!existingTasks || existingTasks.length === 0) {
                        create.mutate({
                          propertyId: room.propertyId,
                          date: today,
                          type: 'TURNOVER',
                        })
                      }
                    }}
                  >
                    + Turnover task
                  </Button>
                )}
                {room.ready && room.needsCleaning && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Ready for check-in
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active properties
          </p>
        )}
      </CardContent>
    </Card>
  )
}
