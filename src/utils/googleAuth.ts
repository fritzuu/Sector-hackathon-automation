import { supabase } from '../lib/supabaseClient.js';

/** Sentinel error name for when the user explicitly closes the OAuth popup. */
export const GOOGLE_CANCELLED = 'GOOGLE_CANCELLED';

export interface GoogleUserData {
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Opens Google OAuth via Supabase and returns the authenticated user's
 * basic profile. Throws an error with name === GOOGLE_CANCELLED when the
 * user dismisses the popup.
 */
export async function signInWithGoogle(): Promise<GoogleUserData> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    const msg = error.message || '';
    if (
      msg.includes('cancelled') ||
      msg.includes('closed') ||
      msg.includes('dismissed') ||
      msg.includes('popup')
    ) {
      const cancelled = new Error(GOOGLE_CANCELLED);
      cancelled.name = GOOGLE_CANCELLED;
      throw cancelled;
    }
    throw error;
  }

  // signInWithOAuth redirects — wait for auth state to settle
  return new Promise<GoogleUserData>((resolve, reject) => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        sub.subscription.unsubscribe();
        const user = session.user;
        const meta = user.user_metadata || {};
        resolve({
          name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Pengguna',
          email: user.email || '',
          avatar: meta.avatar_url || meta.picture || undefined,
        });
      }
    });

    // If no auth event fires within 2 minutes, treat as cancelled
    setTimeout(() => {
      sub.subscription.unsubscribe();
      const cancelled = new Error(GOOGLE_CANCELLED);
      cancelled.name = GOOGLE_CANCELLED;
      reject(cancelled);
    }, 120_000);

    // If the redirect was blocked immediately (no URL returned), cancel
    if (!data?.url) {
      sub.subscription.unsubscribe();
      const cancelled = new Error(GOOGLE_CANCELLED);
      cancelled.name = GOOGLE_CANCELLED;
      reject(cancelled);
    }
  });
}
