import { create } from 'zustand';
import { UserProfile } from '../../../data/userProfiles';
import {
  saveUserProfileToSupabase,
  fetchUserProfileFromSupabase,
} from '../../../services/supabaseStorage';

interface AuthState {
  currentUser: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  syncWithSupabase: (emailOrId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  login: (user) => {
    set({ currentUser: user });
    localStorage.setItem('siba_user', JSON.stringify(user));
    // Persist to Supabase
    saveUserProfileToSupabase(user).then((saved) => {
      set({ currentUser: saved });
    });
  },
  logout: () => {
    localStorage.removeItem('siba_user');
    set({ currentUser: null });
  },
  updateUser: (user) => {
    set({ currentUser: user });
    localStorage.setItem('siba_user', JSON.stringify(user));
    // Persist to Supabase
    saveUserProfileToSupabase(user).catch((err) => {
      console.warn('[AuthStore] Gagal sync ke Supabase:', err);
    });
  },
  syncWithSupabase: async (emailOrId: string) => {
    const profile = await fetchUserProfileFromSupabase(emailOrId);
    if (profile) {
      set({ currentUser: profile });
      localStorage.setItem('siba_user', JSON.stringify(profile));
    }
  },
}));

// Hydrate initial state and sync with Supabase
const savedUser = localStorage.getItem('siba_user');
if (savedUser) {
  try {
    const parsed = JSON.parse(savedUser);
    useAuthStore.setState({ currentUser: parsed });
    // Fetch latest fresh data from Supabase
    if (parsed.email || parsed.id) {
      fetchUserProfileFromSupabase(parsed.email || parsed.id).then((fresh) => {
        if (fresh) {
          useAuthStore.setState({ currentUser: fresh });
          localStorage.setItem('siba_user', JSON.stringify(fresh));
        }
      });
    }
  } catch (e) {
    console.error('Failed to parse saved user', e);
  }
}
