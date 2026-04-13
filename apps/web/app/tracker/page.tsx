'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'

const stages = ['Interested', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected']

export default function Tracker() {
  const [apps, setApps] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const toast = useToast()
  const load = () => api.trackerList().then(setApps)
  useEffect(() => { load() }, [])

  const grouped = useMemo(() => stages.map((stage) => ({ stage, items: apps.filter((app) => app.stage === stage) })), [apps])

  const formatDate = (value?: string | null) => {
    if (!value) return 'No deadline'
    const date = new Date(value)
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
        <Button onClick={async () => { await api.trackerCreate({ title_snapshot: 'New application', org_snapshot: 'Company', stage: 'Interested' }); toast('Application created'); load() }}>Add application</Button>
      </div>
      <div className='grid gap-3 xl:grid-cols-3'>
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
              {column.items.length === 0 ? <EmptyState title='No cards' description='Move an opportunity into this stage.' /> : column.items.map((item) => (
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
                  <p className='text-xs text-muted-foreground'>Deadline: {formatDate(item.deadline_date ?? item.deadline)}</p>
                  {expandedId === item.id ? (
                    <div className='space-y-1 rounded border border-dashed p-2 text-xs text-muted-foreground'>
                      <p>Date applied: {formatDate(item.date_applied)}</p>
                      <p>Notes: {item.notes?.trim() ? item.notes : 'No notes'}</p>
                    </div>
                  ) : null}
                  <div className='flex gap-2'>
                    {item.url_snapshot ? (
                      <Button size='sm' variant='secondary'>
                        <a href={item.url_snapshot} target='_blank' rel='noreferrer'>Job posting</a>
                      </Button>
                    ) : (
                      <Button size='sm' variant='secondary' disabled>Job posting</Button>
                    )}
                    <Button size='sm' variant='secondary' onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}>
                      {expandedId === item.id ? 'Hide details' : 'Details'}
                    </Button>
                    <Button size='sm' onClick={() => setEditing(item)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={Boolean(editing)} title='Edit tracker item' onClose={() => setEditing(null)}>
        {editing ? <form className='space-y-3' onSubmit={async (e) => { e.preventDefault(); const form = new FormData(e.currentTarget); await api.trackerPatch(editing.id, { title_snapshot: form.get('title_snapshot'), org_snapshot: form.get('org_snapshot'), url_snapshot: form.get('url_snapshot'), notes: form.get('notes'), deadline: form.get('deadline') || null, date_applied: form.get('date_applied') || null }); toast('Tracker item updated'); setEditing(null); load() }}>
          <div className='space-y-1'>
            <label htmlFor='title_snapshot' className='text-sm font-medium'>Application title</label>
            <Input id='title_snapshot' name='title_snapshot' defaultValue={editing.title_snapshot || ''} placeholder='Application title' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='org_snapshot' className='text-sm font-medium'>Company</label>
            <Input id='org_snapshot' name='org_snapshot' defaultValue={editing.org_snapshot || ''} placeholder='Company name' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='url_snapshot' className='text-sm font-medium'>Job posting URL</label>
            <Input id='url_snapshot' name='url_snapshot' type='url' defaultValue={editing.url_snapshot || ''} placeholder='https://company.com/jobs/123' />
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
            <label htmlFor='date_applied' className='text-sm font-medium'>Date applied</label>
            <Input id='date_applied' type='date' name='date_applied' defaultValue={editing.date_applied || ''} />
          </div>
          <div className='flex gap-2'>
            <Button type='submit'>Save</Button>
            <Button type='button' variant='danger' onClick={async () => { await api.trackerDelete(editing.id); toast('Tracker item deleted'); setEditing(null); load() }}>Delete</Button>
          </div>
        </form> : null}
      </Modal>
    </div>
  )
}
