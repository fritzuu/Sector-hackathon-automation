import { useEffect } from "react";
import { createRootRouteWithContext, Outlet, useRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../modules/auth/stores/auth.store";

function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    return useAuthStore.subscribe((state, prev) => {
      if (
        state.currentUser?.id !== prev.currentUser?.id ||
        state.authReady !== prev.authReady
      ) {
        router.invalidate();
      }
    });
  }, [router]);

  return <Outlet />;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
    notFoundComponent: () => <div>not found</div>,
  },
);
