import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingPage } from "../modules/dashboard/components/LandingPage";
import { Header } from "../modules/dashboard/components/Header";
import { AuthModal } from "../modules/auth/components/AuthModal";
import { useAuthStore } from "../modules/auth/stores/auth.store";

export const Route = createFileRoute("/_guest/")({
  component: GuestIndexPage,
});

function GuestIndexPage() {
  const navigate = useNavigate();
  const syncFromSession = useAuthStore((state) => state.syncFromSession);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    if (currentUser) {
      navigate({ to: "/dashboard" });
    }
  }, [currentUser, navigate]);

  const [oauthError] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (!query.has('error') && !fragment.has('error')) return false;
    window.history.replaceState({}, '', window.location.pathname);
    return true;
  });
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: "login" | "register";
  }>({
    isOpen: false,
    mode: "login",
  });

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleAuthSuccess = async () => {
    await syncFromSession();
    if (useAuthStore.getState().currentUser) {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white font-sans">
      <Header
        currentUser={null}
        onOpenAuth={handleOpenAuth}
        onLogout={() => {}}
        onOpenTelegramModal={() => {}}
        onRunWorkflow={() => {}}
        onResetReplay={() => {}}
        isRunning={false}
        totalWatchlist={0}
      />
      <main className="flex-1 w-full">
        {oauthError && (
          <p role="alert" className="mx-auto mt-4 max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Login Google dibatalkan atau gagal. Silakan coba lagi.
          </p>
        )}
        <LandingPage onOpenAuth={handleOpenAuth} onAuthSuccess={handleAuthSuccess} />
      </main>
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
