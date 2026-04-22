'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { api, ApiError } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, Section } from '../../components/ui/Card'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

type Opportunity = {
  id: number
  title: string
  org: string
  description: string
  location: string
  tags: string[]
  deadline_date: string | null
  match_score: number
  is_saved: boolean
  url?: string | null
  explanation: { overlap_skills: string[]; snippets: string[] }
}

const sortOptions = [
  { value: 'match', label: 'Best match' },
  { value: 'deadline', label: 'Deadline soonest' },
  { value: 'title', label: 'Title A-Z' },
]

export default function Opportunities() {
  const router = useRouter()
  const toast = useToast()

  const [items, setItems] = useState<Opportunity[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [tag, setTag] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('match')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)
  const [coverLetterText, setCoverLetterText] = useState('')
  const [coverLetterLoading, setCoverLetterLoading] = useState(false)
  const [interviewPrepOpen, setInterviewPrepOpen] = useState(false)
  const [interviewPrepData, setInterviewPrepData] = useState<any>(null)
  const [interviewPrepLoading, setInterviewPrepLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedDescription, setExpandedDescription] = useState(false)

  const syncRoute = (nextSelected?: number | null) => {
    const params = new URLSearchParams()
    if (q) params.set('query', q)
    if (location) params.set('location', location)
    if (tag) params.set('tag', tag)
    if (savedOnly) params.set('saved_only', 'true')
    if (nextSelected) params.set('selected', String(nextSelected))
    router.replace(`/opportunities${params.size ? `?${params.toString()}` : ''}`)
  }

  const load = async (selectedFromUrl?: number | null) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('query', q)
      if (location) params.set('location', location)
      if (tag) params.set('tag', tag)
      if (savedOnly) params.set('saved_only', 'true')
      const data = await api.listOpportunities(params.size ? `?${params.toString()}` : '')
      setItems(data)
      const initial = data.find((item) => item.id === selectedFromUrl)?.id || data[0]?.id || null
      setSelected(initial)
      syncRoute(initial)
    } catch (e: any) {
      setItems([])
      const message = e instanceof ApiError ? e.message : 'Unable to reach API. Please retry.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialQuery = params.get('query') || ''
    const initialLocation = params.get('location') || ''
    const initialTag = params.get('tag') || ''
    const initialSavedOnly = params.get('saved_only') === 'true'
    const initialSelected = Number(params.get('selected')) || null

    setQ(initialQuery)
    setLocation(initialLocation)
    setTag(initialTag)
    setSavedOnly(initialSavedOnly)

    api.getMe()
      .then((me) => {
        console.log('getMe:', me)
        setIsAdmin(me.is_admin)
      })
      .catch((e) => {
        console.log('getMe error:', e)
        setIsAdmin(false)
      })

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const routeParams = new URLSearchParams()
        if (initialQuery) routeParams.set('query', initialQuery)
        if (initialLocation) routeParams.set('location', initialLocation)
        if (initialTag) routeParams.set('tag', initialTag)
        if (initialSavedOnly) routeParams.set('saved_only', 'true')
        const data = await api.listOpportunities(routeParams.size ? `?${routeParams.toString()}` : '')
        setItems(data)
        const initial = data.find((item) => item.id === initialSelected)?.id || data[0]?.id || null
        setSelected(initial)
      } catch (e: any) {
        setItems([])
        setError(e.message || 'Unable to reach API. Please retry.')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const filtered = useMemo(() => {
    const sorted = [...items]
    if (sortBy === 'deadline') sorted.sort((a, b) => (a.deadline_date || '9999').localeCompare(b.deadline_date || '9999'))
    else if (sortBy === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title))
    else sorted.sort((a, b) => b.match_score - a.match_score)
    return sorted
  }, [items, sortBy])

  const selectedItem = filtered.find((item) => item.id === selected)

  const runSeed = async () => {
    try {
      setDetailsLoading(true)
      await api.runSeed()
      toast('Demo opportunities imported')
      await load()
    } catch (e: any) {
      setError(e.message || 'Only admins can seed demo data.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleViewJob = (url?: string | null) => {
    if (!url) {
      toast('Job posting URL not available')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const generateAIMatch = async (id: number) => {
    try {
      setDetailsLoading(true)
      toast("Generating deep AI match analysis...")
      const data = await api.mlMatch(id)
      setItems(items.map(i => i.id === id ? { ...i, match_score: data.match_score, explanation: data.explanation } : i))
      toast('AI Analysis Complete')
    } catch (e: any) {
      toast(e.message || 'Failed to generate AI match')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleCoverLetter = async () => {
    if (!selectedItem) return;
    setCoverLetterOpen(true)
    setCoverLetterLoading(true)
    setCoverLetterText('')
    try {
      const data = await api.generateCoverLetter(selectedItem.id)
      setCoverLetterText(data.cover_letter)
    } catch (e: any) {
      setCoverLetterText(e.message || "Failed to generate cover letter.")
    } finally {
      setCoverLetterLoading(false)
    }
  }

  const handleInterviewPrep = async () => {
    if (!selectedItem) return;
    setInterviewPrepOpen(true)
    setInterviewPrepLoading(true)
    setInterviewPrepData(null)
    try {
      const data = await api.generateInterviewPrep(selectedItem.id)
      setInterviewPrepData(data.questions)
    } catch (e: any) {
      toast(e.message || "Failed to generate interview prep.")
    } finally {
      setInterviewPrepLoading(false)
    }
  }

  const detailContent = selectedItem ? (
    <div className="relative flex flex-col h-[calc(100vh-300px)]">
      <div className="flex-1 overflow-y-auto pr-2">
        <h2 className='text-2xl font-bold tracking-tight mb-2'>{selectedItem.title}</h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-6 text-sm text-muted-foreground font-medium">
          <span className="text-foreground">{selectedItem.org}</span>
          <span>•</span>
          <span>{selectedItem.location}</span>
          <span>•</span>
          <span>{formatDate(selectedItem.deadline_date)}</span>
        </div>

        {/* Why this match panel */}
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <h3 className="font-semibold text-primary">Why this is a match</h3>
            <Badge className="ml-auto bg-primary text-primary-foreground">{selectedItem.match_score}% Score</Badge>
          </div>

          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" className="h-7 text-xs bg-background" onClick={() => generateAIMatch(selectedItem.id)} disabled={detailsLoading}>
              {detailsLoading ? "Analyzing..." : "Refresh with deeper AI Analysis"}
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Matching Skills</p>
            <div className='flex flex-wrap gap-1.5'>
              {selectedItem.explanation?.overlap_skills?.length > 0
                ? selectedItem.explanation.overlap_skills.map((skill) => <Badge variant="secondary" key={`${selectedItem.id}-skill-${skill}`}>{skill}</Badge>)
                : <span className="text-sm text-muted-foreground italic">No direct skill matches found.</span>}
            </div>
          </div>

          {selectedItem.explanation?.snippets?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Relevant Details</p>
              <ul className='space-y-3'>
                {selectedItem.explanation.snippets.map((snippet, idx) => (
                  <li key={`${selectedItem.id}-snippet-${idx}`} className='text-sm leading-relaxed border-l-2 border-primary/40 pl-3 [&_mark]:bg-primary/20 [&_mark]:text-foreground [&_mark]:px-1.5 [&_mark]:py-0.5 [&_mark]:rounded-md font-medium text-muted-foreground' dangerouslySetInnerHTML={{ __html: snippet }} />
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">About the role</h3>
            {!expandedDescription && (
              <Button variant="ghost" size="sm" className="h-6 text-xs font-medium" onClick={() => setExpandedDescription(true)}>
                See more
              </Button>
            )}
          </div>
          <p className={`text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 ${!expandedDescription ? 'line-clamp-3' : ''}`}>
            {selectedItem.description}
          </p>
          {expandedDescription && (
            <Button variant="ghost" size="sm" className="h-6 text-xs font-medium mt-2" onClick={() => setExpandedDescription(false)}>
              See less
            </Button>
          )}
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-3">Tags & Requirements</h3>
          <div className='flex flex-wrap gap-2'>
            {selectedItem.tags?.length > 0
              ? selectedItem.tags.map((entry) => <Badge variant="outline" className="bg-muted/30" key={`${selectedItem.id}-${entry}`}>#{entry}</Badge>)
              : <span className="text-sm text-muted-foreground">No tags specified.</span>}
          </div>
        </div>
      </div>

      {/* Sticky Action Card */}
      <div className="sticky bottom-0 mt-2 bg-card/95 backdrop-blur shadow-soft border rounded-xl p-4 flex flex-col gap-3">
        <div className="flex gap-2 w-full flex-wrap">
          <Button
            className="flex-1 font-semibold shadow-sm"
            onClick={async () => { await api.trackerCreate({ title_snapshot: selectedItem.title, org_snapshot: selectedItem.org, url_snapshot: selectedItem.url, opportunity_id: selectedItem.id }); toast('Added to tracker') }}
          >
            Track
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={!selectedItem.url}
            onClick={() => { if (selectedItem.url) window.open(selectedItem.url, '_blank', 'noopener,noreferrer') }}
          >
            View Job
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleCoverLetter}>
            ✦ Draft&nbsp;
          </Button>
          <Button variant="outline" className="flex-1 bg-background" onClick={handleInterviewPrep}>
            ✦ Prep&nbsp;
          </Button>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rate relevance:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={`rate-${rating}`}
                className="h-7 w-7 rounded-sm text-xs font-medium hover:bg-muted focus-ring transition-colors focus:bg-primary/10 focus:text-primary"
                onClick={async () => { await api.rateOpportunity(selectedItem.id, rating); toast(`Rated ${rating}/5`) }}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : <EmptyState title="Select a role" description="Click on an opportunity from the list to view its details and your match analysis." />

  return (
    <div className='space-y-4 max-w-7xl mx-auto'>
      <Card className='p-2 mb-4 shadow-sm border-border bg-card'>
        <div className='flex flex-wrap gap-2 p-2'>
          <div className="relative w-full sm:flex-1 min-w-0 sm:min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-sm">🔍</span>
            <Input className="pl-9 h-10 border-transparent bg-muted/40 hover:bg-muted/60 focus-visible:bg-background transition-colors" value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search roles, orgs, keywords' aria-label='Opportunity search query' />
          </div>
          <div className="relative w-full sm:flex-1 min-w-0 sm:min-w-[150px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-sm">📍</span>
            <Input className="pl-9 h-10 border-transparent bg-muted/40 hover:bg-muted/60 focus-visible:bg-background transition-colors" value={location} onChange={(e) => setLocation(e.target.value)} placeholder='City, state, remote' aria-label='Location filter' />
          </div>
          <div className="relative w-full sm:flex-1 min-w-0 sm:min-w-[150px] hidden md:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-sm">🏷️</span>
            <Input className="pl-9 h-10 border-transparent bg-muted/40 hover:bg-muted/60 focus-visible:bg-background transition-colors" value={tag} onChange={(e) => setTag(e.target.value)} placeholder='Tag (e.g. backend)' aria-label='Tag filter' />
          </div>
          <Button className="h-10 px-6 font-semibold shadow-sm w-full sm:w-auto" onClick={() => load()}>Search</Button>
          {isAdmin && (
            <Button variant="secondary" className="h-10 px-6 font-semibold shadow-sm w-full sm:w-auto" onClick={() => {
              const url = prompt("Enter job posting URL to extract with AI:");
              if (url) {
                setDetailsLoading(true);
                toast("Extracting role details using ML...");
                api.scrapeUrl(url).then(() => { toast('Opportunity scraped successfully!'); load(); })
                  .catch(e => toast(e.message))
                  .finally(() => setDetailsLoading(false));
              }
            }}>✨ AI Scrape</Button>
          )}
        </div>

        <div className='px-2 pb-2 pt-2 flex flex-wrap items-center gap-3 border-t border-border/50'>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 hidden sm:block">Filters:</span>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 items-center">
            {['robotics', 'python', 'frontend', 'backend', 'research'].map((chip) => (
              <button
                key={chip}
                className={`flex-shrink-0 focus-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors ${tag === chip ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 hover:bg-muted/80'}`}
                onClick={() => setTag(tag === chip ? '' : chip)}
              >
                #{chip}
              </button>
            ))}
          </div>

          <Select className="h-8 text-xs border-none bg-transparent hover:bg-muted/50 w-auto font-medium focus-ring rounded-md" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label='Sort opportunities'>
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </div>
      </Card>

      {error ? <Card className='border-danger/40 bg-danger/10 p-4 text-sm rounded-xl'><div className='flex items-center justify-between gap-3 text-danger-foreground font-medium'><p>{error}</p><Button size='sm' variant='secondary' className="bg-white/50 hover:bg-white/80 text-black border-none" onClick={() => load()}>Retry</Button></div></Card> : null}

      {loading ? <div className='grid gap-6 xl:grid-cols-[1fr_450px]'><div className="space-y-4"><Skeleton className='h-32 rounded-xl' /><Skeleton className='h-32 rounded-xl' /><Skeleton className='h-32 rounded-xl' /></div><Skeleton className='hidden xl:block h-[600px] rounded-xl' /></div> : null}

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState title='No matching opportunities found' description={isAdmin ? 'Seed demo opportunities or change your filters.' : 'Adjust your search filters or ask an admin to seed demo data.'} action={isAdmin ? <Button onClick={runSeed} disabled={detailsLoading}>{detailsLoading ? 'Seeding Data…' : 'Seed Demo Data'}</Button> : <Button variant="outline" onClick={() => { setQ(''); setLocation(''); setTag(''); setSavedOnly(false); load() }}>Clear Filters</Button>} />
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className='grid gap-6 xl:grid-cols-[1fr_minmax(400px,450px)] relative items-start'>

          {/* Feed Column */}
          <div className='space-y-3 pb-8'>
            {filtered.map((item) => {
              const active = item.id === selected
              return (
                <Card
                  key={item.id}
                  className={`relative p-5 text-left cursor-pointer transition-all duration-200 border group ${active
                    ? 'border-primary/50 shadow-md bg-muted/20 ring-1 ring-primary/20'
                    : 'hover:border-primary/30 hover:shadow-soft bg-card border-border'
                    }`}
                  onClick={() => { setSelected(item.id); syncRoute(item.id) }}
                >
                  {/* Bookmark indicator */}
                  {item.is_saved && (
                    <div className="absolute top-0 right-6 w-4 h-6 bg-primary/20 flex justify-center pt-1 rounded-b-md shadow-sm">
                      <span className="text-[10px] leading-none text-primary p-0 m-0">★</span>
                    </div>
                  )}

                  <div className='flex items-start justify-between gap-4 mb-3'>
                    <div>
                      <h3 className='font-bold text-lg text-foreground group-hover:text-primary transition-colors pr-8'>{item.title}</h3>
                      <p className='text-sm font-medium text-foreground/80 mt-1'>
                        {item.org} <span className="text-muted-foreground/60 mx-1">•</span> <span className="text-muted-foreground">{item.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Match insights preview */}
                  <div className={`mt-4 pt-3 border-t flex flex-wrap items-center gap-2 ${active ? 'border-primary/20' : 'border-border/60'}`}>
                    <Badge variant={active ? "default" : "secondary"} className={active ? "bg-primary text-primary-foreground" : "font-semibold"}>
                      {item.match_score}% Match
                    </Badge>
                    <div className='flex flex-wrap gap-1.5 ml-1'>
                      {(item.explanation?.overlap_skills || []).slice(0, 3).map((skill) => (
                        <span key={`${item.id}-${skill}`} className='text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md'>
                          {skill}
                        </span>
                      ))}
                      {(item.explanation?.overlap_skills?.length || 0) > 3 && (
                        <span className='text-xs font-medium text-muted-foreground px-1 py-0.5'>
                          +{(item.explanation.overlap_skills.length - 3)}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Details Column (Sticky) */}
          <div className='hidden xl:block h-[calc(100vh-300px)] sticky top-24'>
            <Card className='h-full p-0 overflow-hidden shadow-card border-border relative bg-card'>
              {selectedItem ? detailContent : <div className="h-full flex items-center justify-center p-8 text-center text-muted-foreground"><p>Select a role from the feed to view full details and insights.</p></div>}
            </Card>
          </div>

          {/* Mobile Drawer */}
          <Button className='xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 shadow-lg shadow-black/20 rounded-full px-6' onClick={() => setMobileOpen(true)} disabled={!selectedItem}>
            View role details
          </Button>
          <Drawer open={mobileOpen} title='Role details' onClose={() => setMobileOpen(false)}>
            {detailContent}
          </Drawer>
        </div>
      ) : null}

      <Modal open={coverLetterOpen} title="AI Cover Letter Draft" onClose={() => setCoverLetterOpen(false)}>
        <div className="p-4 space-y-4">
          {coverLetterLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm text-foreground/90 font-medium overflow-y-auto max-h-[60vh]">
              {coverLetterText}
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <Button onClick={() => { navigator.clipboard.writeText(coverLetterText); toast('Copied to clipboard!') }} disabled={coverLetterLoading || !coverLetterText}>
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={interviewPrepOpen} title="AI Interview Prep" onClose={() => setInterviewPrepOpen(false)}>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {interviewPrepLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-6 w-3/4 mt-4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : interviewPrepData ? (
            <div className="space-y-6">
              {interviewPrepData.map((q: any, i: number) => (
                <div key={i} className="space-y-2">
                  <h4 className="font-semibold text-foreground">Q{i + 1}: {q.question}</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {q.talking_points.map((pt: string, j: number) => (
                      <li key={j} className="text-sm text-muted-foreground">{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
