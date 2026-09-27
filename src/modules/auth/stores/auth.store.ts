import { create } from 'zustand';
import { UserProfile } from '../../../data/userProfiles';

interface AuthState {
  currentUser: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null, // Will be hydrated on mount or handled by a persistence middleware
  login: (user) => {
    localStorage.setItem('siba_user', JSON.stringify(user));
    localStorage.setItem('siba_saved_session', JSON.stringify(user));
    set({ currentUser: user });
  },
  logout: () => {
    localStorage.removeItem('siba_user');
    set({ currentUser: null });
  },
  updateUser: (user) => {
    localStorage.setItem('siba_user', JSON.stringify(user));
    localStorage.setItem('siba_saved_session', JSON.stringify(user));
    set({ currentUser: user });
  }
}));

// Hydrate initial state
const savedUser = localStorage.getItem('siba_user');
if (savedUser) {
  try {
    useAuthStore.setState({ currentUser: JSON.parse(savedUser) });
  } catch (e) {
    console.error('Failed to parse saved user', e);
  }
}
