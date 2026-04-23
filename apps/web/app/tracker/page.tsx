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

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / 86400000)
}

export default function Tracker() {
  const [apps, setApps] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [reminderLoading, setReminderLoading] = useState(false)
  const toast = useToast()
  const load = () => api.trackerList().then(setApps)
  useEffect(() => { load() }, [])

  const upcomingDeadlines = useMemo(() =>
    apps
      .filter((a) => {
        const d = daysUntil(a.deadline_date)
        return d !== null && d >= 0 && d <= 7 && a.stage !== 'Offer' && a.stage !== 'Rejected'
      })
      .sort((a, b) => (a.deadline_date || '').localeCompare(b.deadline_date || '')),
    [apps]
  )

  const grouped = useMemo(() => stages.map((stage) => ({ stage, items: apps.filter((app) => app.stage === stage) })), [apps])

  const sendReminder = async () => {
    setReminderLoading(true)
    try {
      const res = await api.sendDeadlineReminder()
      if (res.sent) toast(`Reminder sent for ${res.count} deadline(s)`)
      else toast(res.reason || 'No email sent')
    } catch {
      toast('Failed to send reminder')
    } finally {
      setReminderLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1>Application tracker</h1>
        <Button onClick={async () => { await api.trackerCreate({ title_snapshot: 'New application', org_snapshot: 'Company', stage: 'Interested' }); toast('Application created'); load() }}>Add application</Button>
      </div>

      {upcomingDeadlines.length > 0 && (
        <div className='rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4'>
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <div>
              <p className='font-semibold text-amber-800 dark:text-amber-300 mb-1'>
                ⏰ {upcomingDeadlines.length} deadline{upcomingDeadlines.length > 1 ? 's' : ''} in the next 7 days
              </p>
              <ul className='text-sm text-amber-700 dark:text-amber-400 space-y-0.5'>
                {upcomingDeadlines.map((a) => {
                  const d = daysUntil(a.deadline_date)
                  return (
                    <li key={a.id}>
                      <span className='font-medium'>{a.title_snapshot}</span> · {a.org_snapshot} —{' '}
                      <span className={d === 0 ? 'font-bold text-red-600' : ''}>
                        {d === 0 ? 'due today' : `${d} day${d === 1 ? '' : 's'} left`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <Button size='sm' variant='outline' className='shrink-0 border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40' onClick={sendReminder} disabled={reminderLoading}>
              {reminderLoading ? 'Sending…' : '📧 Email me reminders'}
            </Button>
          </div>
        </div>
      )}
      <div className='grid gap-3 xl:grid-cols-3'>
        {grouped.map((column) => (
          <Card key={column.stage}>
            <h3 className='mb-3'>{column.stage}</h3>
            <div className='space-y-2'>
              {column.items.length === 0 ? <EmptyState title='No cards' description='Move an opportunity into this stage.' /> : column.items.map((item) => (
                <div key={item.id} className='space-y-2 rounded-lg border bg-background p-3'>
                  <p className='font-medium'>{item.title_snapshot}</p>
                  <p className='text-xs text-muted-foreground'>{item.org_snapshot}</p>
                  {item.deadline_date && (() => {
                    const d = daysUntil(item.deadline_date)
                    return (
                      <p className={`text-xs font-medium ${d !== null && d <= 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        📅 {item.deadline_date}{d !== null && d >= 0 && d <= 7 ? ` · ${d === 0 ? 'today' : `${d}d left`}` : ''}
                      </p>
                    )
                  })()}
                  <div className='flex gap-2'>
                    <Select value={item.stage} onChange={async (e) => { await api.trackerPatchStage(item.id, e.target.value); load() }}>{stages.map((s) => <option key={s}>{s}</option>)}</Select>
                    <Button size='sm' onClick={() => setEditing(item)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={Boolean(editing)} title='Edit tracker item' onClose={() => setEditing(null)}>
        {editing ? <form className='space-y-3' onSubmit={async (e) => { e.preventDefault(); const form = new FormData(e.currentTarget); await api.trackerPatch(editing.id, { title_snapshot: form.get('title_snapshot'), org_snapshot: form.get('org_snapshot'), notes: form.get('notes'), deadline: form.get('deadline') || null, date_applied: form.get('date_applied') || null }); toast('Tracker item updated'); setEditing(null); load() }}>
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
