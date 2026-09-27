import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { useAuthStore, waitForAuthReady } from '../modules/auth/stores/auth.store';
import { useEffect } from 'react';

export const Route = createFileRoute('/_guest')({
  beforeLoad: async () => {
    await waitForAuthReady();
    const { currentUser } = useAuthStore.getState();
    if (currentUser) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: GuestLayout,
});

function GuestLayout() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    if (currentUser) {
      navigate({ to: '/dashboard' });
    }
  }, [currentUser, navigate]);

  return <Outlet />;
}
