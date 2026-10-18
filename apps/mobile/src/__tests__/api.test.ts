import { api, ApiError } from '@/lib/api';

const mockStore = new Map<string, string>();
jest.mock('@/lib/db', () => ({
  getSetting: jest.fn(async (k: string) => mockStore.get(k) ?? null),
  setSetting: jest.fn(async (k: string, v: string | null) => {
    if (v === null) mockStore.delete(k);
    else mockStore.set(k, v);
  }),
}));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { aiProxyUrl: 'https://proxy.test' } } }));

const ctx = { addiction: 'alcohol' as const, daysClean: 3, entry: 'Rough day at work.' };
const json = (status: number, body: unknown) => ({ status, ok: status < 400, json: async () => body }) as Response;

beforeEach(() => mockStore.clear());

describe('api client', () => {
  it('registers, then sends the bearer token', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(json(200, { token: 't1', expiresAt: Date.now() / 1000 + 3600 }))
      .mockResolvedValueOnce(json(200, { crisis: false, message: 'You did well.' }));
    global.fetch = fetchMock;
    await expect(api.coach(ctx)).resolves.toEqual({ crisis: false, message: 'You did well.' });
    expect(fetchMock.mock.calls[1][0]).toBe('https://proxy.test/v1/support/coach');
    expect(fetchMock.mock.calls[1][1].headers.authorization).toBe('Bearer t1');
  });

  it('gets a fresh token after a 401', async () => {
    mockStore.set('apiToken', JSON.stringify({ token: 'old', expiresAt: Date.now() / 1000 + 3600 }));
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(json(401, { error: 'unauthorized' }))
      .mockResolvedValueOnce(json(200, { token: 'new', expiresAt: Date.now() / 1000 + 3600 }))
      .mockResolvedValueOnce(json(200, { crisis: false, message: 'ok' }));
    global.fetch = fetchMock;
    await api.coach(ctx);
    expect(fetchMock.mock.calls[2][1].headers.authorization).toBe('Bearer new');
  });

  it('reports offline errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(api.coach(ctx)).rejects.toMatchObject({ kind: 'offline' });
    await expect(api.coach(ctx)).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects malformed server responses', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(json(200, { token: 't', expiresAt: Date.now() / 1000 + 3600 }))
      .mockResolvedValueOnce(json(200, { nope: true }));
    await expect(api.coach(ctx)).rejects.toMatchObject({ kind: 'unavailable' });
  });
});
