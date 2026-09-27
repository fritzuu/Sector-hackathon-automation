import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LandingPage } from "../modules/dashboard/components/LandingPage";
import { Header } from "../modules/dashboard/components/Header";
import { AuthModal } from "../modules/auth/components/AuthModal";
import { useAuthStore } from "../modules/auth/stores/auth.store";
import { generateSecurePairingToken } from "../utils/token";
import { UserProfile } from "../data/userProfiles";

export const Route = createFileRoute("/_guest/")({
  component: GuestIndexPage,
});

function GuestIndexPage() {
  const navigate = useNavigate();
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: "login" | "register";
  }>({
    isOpen: false,
    mode: "login",
  });

  const login = useAuthStore((state) => state.login);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleAuthSuccess = (userData: { name: string; email: string }) => {
    const saved = localStorage.getItem("siba_saved_session");
    let previousProfile: UserProfile | null = null;
    if (saved) {
      try {
        previousProfile = JSON.parse(saved);
      } catch (e) {}
    }

    const newUser: UserProfile = {
      id: previousProfile?.id || `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatar: previousProfile?.avatar || "",
      role: previousProfile?.role || "Investor Ritel",
      telegramChatId: previousProfile?.telegramChatId || null,
      telegramUsername: previousProfile?.telegramUsername || null,
      isTelegramLinked: previousProfile?.isTelegramLinked || false,
      pairingToken:
        previousProfile?.pairingToken || generateSecurePairingToken(),
      defaultWatchlist: previousProfile?.defaultWatchlist || [],
    };
    login(newUser);
    navigate({ to: "/dashboard" }); // Force the router to navigate
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
        <LandingPage onOpenAuth={handleOpenAuth} />
      </main>

      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: "login" })}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
