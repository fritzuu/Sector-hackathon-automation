import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingPage } from "../modules/dashboard/components/LandingPage";
import { Header } from "../modules/dashboard/components/Header";
import { useAuthStore } from "../modules/auth/stores/auth.store";
import { generateSecurePairingToken } from "../utils/token";
import { UserProfile } from "../data/userProfiles";
import {
  fetchUserProfileFromSupabase,
  saveUserProfileToSupabase,
} from "../services/supabaseStorage";

export const Route = createFileRoute("/_guest/")({
  component: GuestIndexPage,
});

function GuestIndexPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleOpenAuth = (mode: "login" | "register") => {
    // Header buttons still call this — scroll to hero panel as a convenience
    const hero = document.getElementById("siba-hero-auth");
    if (hero) {
      hero.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAuthSuccess = async (userData: {
    name: string;
    email: string;
    avatar?: string;
  }) => {
    // 1. Try to fetch existing user profile from Supabase
    let profile = await fetchUserProfileFromSupabase(userData.email);

    if (!profile) {
      // 2. If not found in Supabase, create a new profile and save to Supabase
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || "",
        role: "Investor Ritel",
        telegramChatId: null,
        telegramUsername: null,
        isTelegramLinked: false,
        pairingToken: generateSecurePairingToken(),
        defaultWatchlist: ["BBCA", "TLKM", "UNTR"],
      };

      profile = await saveUserProfileToSupabase(newUser);
    }

    login(profile);
    navigate({ to: "/dashboard" });
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
    </div>
  );
}
