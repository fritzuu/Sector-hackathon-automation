import { useState } from "react";
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
