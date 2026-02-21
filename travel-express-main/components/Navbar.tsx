"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/actions/logout.action";
import { useRouter } from "next/navigation";
import { User, LogOut, FileText, Globe, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils"; 
import { useEffect, useState } from "react";

interface NavbarProps {
  isConnected: boolean;
  userRole?: string;
  userName?: string;
}

const Navbar = ({ isConnected, userRole, userName }: NavbarProps) => {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [studentNotifCount, setStudentNotifCount] = useState(0);

  const clearClientSessionData = async () => {
    localStorage.removeItem("travelExpressUser");
    localStorage.removeItem("travelExpressToken");
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAction();
      await clearClientSessionData();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ✅ Ouvrir discussions sur /messaging-admin ou /messaging-student selon le rôle
  const openMessaging = () => {
    if (!isConnected) return;
    const isAdmin = ["SUPERADMIN", "STUDENT_MANAGER"].includes(userRole || "");
    const messagingRoute = isAdmin ? "/messaging-admin" : "/messaging-student";
    router.push(messagingRoute);
  };

  // Condition : si c'est un admin, on cache la navbar
  const isAdmin = !!userRole && userRole !== "STUDENT";

  useEffect(() => {
    if (!isConnected || isAdmin) return;

    let mounted = true;

    const pollNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/summary", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setStudentNotifCount(Number(data?.total || 0));
      } catch {}
    };

    pollNotifications();
    const id = setInterval(pollNotifications, 12000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isConnected, isAdmin]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all",
        isAdmin ? "hidden" : "flex"
      )}
    >
      <nav className="container mx-auto px-6 h-20 flex items-center justify-between w-full">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-[#db9b16] text-sm font-black transition-transform group-hover:scale-110">
            TE
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black text-slate-900 tracking-tight">
              Travel Express
            </span>
            <span className="text-[10px] font-bold text-[#db9b16] uppercase tracking-widest">
              Student Portal
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
          <Link
            href="/#destinations"
            className="hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            <Globe size={16} /> Destinations
          </Link>
          {isConnected && (
            <Link
              href="/student/"
              className="hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <FileText size={16} /> Mes Dossiers
            </Link>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          {!isConnected ? (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="font-bold text-slate-600">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full px-6 bg-slate-900 hover:bg-[#db9b16] text-white transition-all shadow-lg shadow-slate-200">
                  S'inscrire
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
              
              {/* ✅ ICÔNE DISCUSSION - Clique pour aller aux discussions */}
              <button
                onClick={openMessaging}
                className="p-2 text-slate-400 hover:text-[#db9b16] transition-colors relative"
                title="Discussions"
              >
                <MessageCircle size={18} />
                {studentNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {studentNotifCount > 99 ? "99+" : studentNotifCount}
                  </span>
                )}
              </button>

              <div className="w-px h-4 bg-slate-200 mx-1" />

              {/* MENU DÉROULANT PROFIL */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-3 pl-3 pr-1 hover:bg-white rounded-full transition-colors"
                >
                  <span className="hidden lg:block text-xs font-black text-slate-700">
                    {userName || "Mon Profil"}
                  </span>
                  <div className="h-8 w-8 bg-[#db9b16] rounded-full flex items-center justify-center text-white shadow-inner">
                    <User size={16} />
                  </div>
                </button>

                {/* MENU DÉROULANT */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                    <Link 
                      href="/student"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-100"
                      onClick={() => setShowMenu(false)}
                    >
                      <User size={16} />
                      Mon Profil
                    </Link>
                    <Link 
                      href="/student/settings"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-100"
                      onClick={() => setShowMenu(false)}
                    >
                      <Settings size={16} />
                      Paramètres
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-bold"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>

              <div className="w-px h-4 bg-slate-200 mx-1" />
            </div>
          )}
        </div>
      </nav>

    </header>
  );
};

export default Navbar;
