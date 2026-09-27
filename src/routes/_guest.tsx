import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../modules/auth/stores/auth.store';

export const Route = createFileRoute('/_guest')({
  beforeLoad: () => {
    const user = useAuthStore.getState().currentUser;
    if (user) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: () => <Outlet />,
});
