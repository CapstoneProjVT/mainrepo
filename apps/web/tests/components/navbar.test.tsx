import { render, screen } from '@testing-library/react'
import { AppShell } from '../../components/layout/AppShell'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/opportunities' }))
vi.mock('../../lib/api', () => ({ api: { getMe: vi.fn().mockResolvedValue({ is_admin: true }) } }))

describe('AppShell navbar', () => {
  it('renders global search and key nav labels', async () => {
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.getByText('InternAtlas')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search people, opportunities, and tags')).toBeInTheDocument()
    expect(screen.getByText('Tracker')).toBeInTheDocument()
  })
})
