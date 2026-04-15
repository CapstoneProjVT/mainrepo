'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'

const stages = ['Interested', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected']

export default function Tracker() {
  const [apps, setApps] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const toggleExpand = (stage: string) => setExpandedStages((prev) => { const next = new Set(prev); next.has(stage) ? next.delete(stage) : next.add(stage); return next })
  const toast = useToast()
  const load = () => api.trackerList().then(setApps)
  useEffect(() => { load() }, [])

  const sortApps = (items: any[]) => [...items].sort((a, b) => {
    const dateA = a.deadline_date ?? a.deadline
    const dateB = b.deadline_date ?? b.deadline
    if (dateA && dateB) return new Date(dateA).getTime() - new Date(dateB).getTime()
    if (dateA) return -1
    if (dateB) return 1
    return (a.title_snapshot ?? '').localeCompare(b.title_snapshot ?? '')
  })
  const grouped = useMemo(() => stages.map((stage) => ({ stage, items: sortApps(apps.filter((app) => app.stage === stage)) })), [apps])

  const formatDate = (value?: string | null) => {
    if (!value) return 'No deadline'
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const date = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const moveToStage = async (id: number, stage: string) => {
    await api.trackerPatchStage(id, stage)
    await load()
    toast(`Moved to ${stage}`)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1>Application tracker</h1>
        <Button onClick={async () => { const created = await api.trackerCreate({ title_snapshot: 'New application', org_snapshot: 'Company', stage: 'Interested' }); await load(); setEditing(created) }}>Add application</Button>
      </div>
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {grouped.map((column) => (
          <Card
            key={column.stage}
            className={dragOverStage === column.stage ? 'ring-2 ring-primary' : ''}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragOverStage !== column.stage) setDragOverStage(column.stage)
            }}
            onDragLeave={() => setDragOverStage((current) => current === column.stage ? null : current)}
            onDrop={async (e) => {
              e.preventDefault()
              const droppedId = Number(e.dataTransfer.getData('text/plain'))
              setDragOverStage(null)
              setDraggingId(null)
              if (!droppedId) return
              const item = apps.find((app) => app.id === droppedId)
              if (!item || item.stage === column.stage) return
              await moveToStage(droppedId, column.stage)
            }}
          >
            <h3 className='mb-3'>{column.stage}</h3>
            <div className='space-y-2'>
              {column.items.length === 0 ? <EmptyState title='No cards' description='Move an opportunity into this stage.' /> : (() => {
                const isExpanded = expandedStages.has(column.stage); const visibleItems = isExpanded ? column.items : column.items.slice(0, 3); const hiddenCount = column.items.length - 3; return (<><div className='space-y-2'>{visibleItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingId(item.id)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', String(item.id))
                    }}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDragOverStage(null)
                    }}
                    className={`space-y-2 rounded-lg border bg-background p-3 ${draggingId === item.id ? 'opacity-60' : ''}`}
                  >
                    <p className='font-medium'>{item.title_snapshot}</p>
                    <p className='text-xs text-muted-foreground'>{item.org_snapshot}</p>
                    <p className='text-xs text-muted-foreground'>Due: {formatDate(item.deadline_date ?? item.deadline)}</p>
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        variant='secondary'
                        disabled={!item.url_snapshot}
                        onClick={() => {
                          if (!item.url_snapshot) return
                          window.open(item.url_snapshot, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        URL
                      </Button>
                      <Button size='sm' onClick={() => setEditing(item)}>Details</Button>
                      <span className='ml-auto cursor-grab active:cursor-grabbing select-none text-lg text-muted-foreground hover:text-foreground' title='Drag to move'>⠿</span>
                    </div>
                  </div>
                ))}</div>{column.items.length > 3 && (<button type='button' className='w-full pt-1 text-xs text-muted-foreground hover:text-foreground' onClick={() => toggleExpand(column.stage)}>{isExpanded ? 'See less' : `See ${hiddenCount} more`}</button>)}</>)
              })()}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={Boolean(editing)} title='Application details' onClose={() => setEditing(null)}>
        {editing ? <form className='space-y-3' onSubmit={async (e) => { e.preventDefault(); const form = new FormData(e.currentTarget); await api.trackerPatch(editing.id, { title_snapshot: form.get('title_snapshot'), org_snapshot: form.get('org_snapshot'), url_snapshot: form.get('url_snapshot'), stage: form.get('stage'), notes: form.get('notes'), deadline: form.get('deadline') || null }); await load(); setEditing(null); toast('Tracker item updated') }}>
          <div className='space-y-1'>
            <label htmlFor='title_snapshot' className='text-sm font-medium'>Application title</label>
            <Input id='title_snapshot' name='title_snapshot' defaultValue={editing.title_snapshot || ''} placeholder='Application title' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='org_snapshot' className='text-sm font-medium'>Company</label>
            <Input id='org_snapshot' name='org_snapshot' defaultValue={editing.org_snapshot || ''} placeholder='Company name' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='notes' className='text-sm font-medium'>Notes</label>
            <Textarea id='notes' name='notes' defaultValue={editing.notes || ''} placeholder='Notes' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='deadline' className='text-sm font-medium'>Deadline</label>
            <Input id='deadline' type='date' name='deadline' defaultValue={editing.deadline_date || ''} />
          </div>
          <div className='space-y-1'>
            <label htmlFor='url_snapshot' className='text-sm font-medium'>Job posting URL</label>
            <Input id='url_snapshot' name='url_snapshot' type='url' defaultValue={editing.url_snapshot || ''} placeholder='https://company.com/jobs/123' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='stage' className='text-sm font-medium'>Stage</label>
            <Select id='stage' name='stage' defaultValue={editing.stage || 'Interested'}>
              {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </Select>
          </div>
          <div className='flex gap-2'>
            <Button type='submit'>Save</Button>
            <Button type='button' variant='danger' onClick={async () => { await api.trackerDelete(editing.id); toast('Tracker item deleted'); setEditing(null); await load() }}>Delete</Button>
          </div>
        </form> : null}
      </Modal>
    </div>
  )
}
