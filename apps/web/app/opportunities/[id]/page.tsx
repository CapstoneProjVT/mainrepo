'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatDate } from '../../../lib/utils'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, Section } from '../../../components/ui/Card'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../components/ui/Toast'

export default function OppDetail({ params }: { params: { id: string } }) {
  const [opp, setOpp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { api.getOpportunity(params.id).then(setOpp).finally(() => setLoading(false)) }, [params.id])

  if (loading) return <Skeleton className='h-64' />
  if (!opp) return <Card>Not found.</Card>

  return (
    <Section>
      <Card>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1>{opp.title}</h1>
            <p className='text-sm text-muted-foreground'>{opp.org} · {opp.location} · {formatDate(opp.deadline_date)}</p>
          </div>
          <Badge>Match {opp.match_score}%</Badge>
        </div>
        <p className='mt-4 text-sm'>{opp.description}</p>
      </Card>
      <Card>
        <h2>Explanation</h2>
        <div className='mt-3 flex flex-wrap gap-2'>
          {(opp.explanation?.overlap_skills || []).map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
        </div>
        <div className='mt-4 space-y-2'>
          {(opp.explanation?.snippets || []).map((snippet: string, idx: number) => (
            <p key={idx} className='rounded-lg border bg-muted/40 p-3 text-sm [&_mark]:rounded [&_mark]:bg-accent/25 [&_mark]:px-1' dangerouslySetInnerHTML={{ __html: snippet }} />
          ))}
        </div>
      </Card>
      <Card className='flex flex-wrap items-center gap-2'>
        <Button onClick={async () => { await api.saveOpportunity(params.id); toast('Saved opportunity') }}>Save</Button>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button key={rating} size='sm' variant='secondary' onClick={async () => { await api.rateOpportunity(params.id, rating); toast(`Rated ${rating}/5`) }}>{rating}</Button>
        ))}
      </Card>
    </Section>
  )
}
