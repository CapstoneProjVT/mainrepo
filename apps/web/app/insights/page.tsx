'use client'

import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

export default function Insights() {
  const [funnel, setFunnel] = useState<any>(null)
  const [krs, setKrs] = useState<any>(null)
  const [weekly, setWeekly] = useState<Array<{ week: string; count: number }> | null>(null)
  const toast = useToast()

  useEffect(() => { Promise.all([api.funnel(), api.krs(), api.appsPerWeek()]).then(([f, k, w]) => { setFunnel(f); setKrs(k); setWeekly(w) }) }, [])
  if (!funnel || !krs || !weekly) return <div className='space-y-2'><Skeleton className='h-24' /><Skeleton className='h-48' /></div>
  const max = Math.max(1, ...weekly.map((item) => item.count))

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'><h1>Insights</h1><Button onClick={async () => { await api.exportCsv(); toast('Export started') }}>Export CSV</Button></div>
      <div className='grid gap-3 md:grid-cols-4'>{[['Tracked %',krs.tracked_pct],['P95 latency',`${krs.match_latency_p95}ms`],['Relevance avg',krs.relevance_avg],['TTS-10',krs.time_to_shortlist_10 ?? '—']].map(([k,v]) => <Card key={String(k)}><p className='text-xs text-muted-foreground'>{k}</p><p className='text-2xl font-semibold'>{String(v)}</p></Card>)}</div>
      <Card><h3 className='mb-3'>Funnel</h3><div className='grid gap-2 md:grid-cols-3'>{Object.entries(funnel.counts).map(([stage, count]) => <div key={stage} className='rounded-lg border bg-background p-3'><p className='text-xs text-muted-foreground'>{stage}</p><p className='text-lg font-semibold'>{count as number}</p></div>)}</div></Card>
      <Card><h3 className='mb-3'>Applications per week</h3>{weekly.length === 0 ? <EmptyState title='No activity yet' description='Add applications to populate weekly insights.' /> : <div className='flex h-52 items-end gap-2'>{weekly.map((item) => <div key={item.week} className='group flex-1'><div className='rounded-t-md bg-primary transition group-hover:brightness-110' style={{ height: `${(item.count / max) * 100}%` }} /><p className='mt-1 truncate text-[10px] text-muted-foreground'>{item.week}</p></div>)}</div>}</Card>
    </div>
  )
}
