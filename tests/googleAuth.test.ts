import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signInWithOAuth } = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: { auth: { signInWithOAuth } },
}));

import { signInWithGoogle } from '../src/utils/googleAuth';

describe('Google OAuth redirect', () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
  });

  it('starts a full-page redirect to Google through Supabase', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/' }, error: null });

    await expect(signInWithGoogle()).resolves.toBeUndefined();
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/' },
    });
  });

  it('reports provider errors rather than waiting for a popup event', async () => {
    const error = new Error('Provider not enabled');
    signInWithOAuth.mockResolvedValue({ data: null, error });

    await expect(signInWithGoogle()).rejects.toBe(error);
  });

  it('rejects an absent authorization URL', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });

    await expect(signInWithGoogle()).rejects.toThrow('URL login');
  });
});
