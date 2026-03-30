import { api, ApiError } from '../../lib/api'

describe('api client', () => {
  it('uses NEXT_PUBLIC_API_BASE and returns json', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"id":1,"email":"a@b.com","is_admin":false}'),
      headers: { get: () => 'application/json' },
    } as Response)

    const me = await api.getMe()
    expect(me.email).toBe('a@b.com')
    expect(fetch).toHaveBeenCalledWith('/api/me', expect.anything())
  })

  it('throws ApiError on non-200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('{"detail":"server down"}'),
      headers: { get: () => 'application/json' },
    } as Response)

    await expect(api.getMe()).rejects.toBeInstanceOf(ApiError)
  })
})
