import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../modules/auth/stores/auth.store';

export const Route = createFileRoute('/_guest')({
  beforeLoad: () => {
    const { currentUser, authReady } = useAuthStore.getState();
    if (authReady && currentUser) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: () => <Outlet />,
});
