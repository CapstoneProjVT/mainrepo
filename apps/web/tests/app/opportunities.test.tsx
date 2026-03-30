import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Opportunities from '../../app/opportunities/page'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('../../components/ui/Toast', () => ({ useToast: () => vi.fn() }))

const listOpportunities = vi.fn()
vi.mock('../../lib/api', () => ({
  api: {
    getMe: vi.fn().mockResolvedValue({ is_admin: true }),
    listOpportunities: (...args: unknown[]) => listOpportunities(...args),
    runSeed: vi.fn(),
    saveOpportunity: vi.fn(),
    trackerCreate: vi.fn(),
    rateOpportunity: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

const baseItem = {
  id: 1,
  title: 'Backend Intern',
  org: 'Acme',
  description: 'Build APIs',
  location: 'Remote',
  tags: ['backend'],
  deadline_date: '2026-01-01',
  match_score: 91,
  explanation: { overlap_skills: ['python'], snippets: [] },
}

describe('Opportunities page', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/opportunities')
  })

  it('shows opportunities list and filters', async () => {
    listOpportunities.mockResolvedValueOnce([baseItem])
    render(<Opportunities />)
    expect(await screen.findByText('Backend Intern')).toBeInTheDocument()
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('shows empty state', async () => {
    listOpportunities.mockResolvedValueOnce([])
    render(<Opportunities />)
    expect(await screen.findByText('No opportunities yet')).toBeInTheDocument()
  })

  it('shows error state and retry button', async () => {
    listOpportunities.mockRejectedValueOnce(new Error('boom'))
    listOpportunities.mockResolvedValueOnce([baseItem])
    render(<Opportunities />)
    expect(await screen.findByText('boom')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Retry'))
    await waitFor(() => expect(listOpportunities).toHaveBeenCalledTimes(2))
  })
})
