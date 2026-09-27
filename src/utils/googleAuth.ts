import { supabase } from '../lib/supabaseClient.js';

/** Supabase navigates to Google; the session is restored when the app reloads. */
export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Google OAuth tidak mengembalikan URL login.');
}
