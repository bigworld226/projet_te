
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users, FileText, Globe, LogOut, ChevronLeft, ChevronRight, Menu, MessageSquare, Settings } from "lucide-react";
import { logoutAction } from "@/actions/logout.action";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { label: 'Etudiants', href: '/admin/students', icon: Users },
  { label: 'Documents', href: '/admin/documents', icon: FileText },
  { label: 'Universités', href: '/admin/universities', icon: Globe },
  { label: 'Ajouter Université', href: '/admin/universities/new', icon: Globe },
  { label: 'Messagerie', href: '/messaging-admin', icon: MessageSquare },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [adminNotifCount, setAdminNotifCount] = useState(0);
  const prevNotifCountRef = useRef(0);
  const prevUnreadCountRef = useRef(0);
  const lastMessageAtRef = useRef<string | null>(null);
  const notifInitializedRef = useRef(false);
  const notifAudioRef = useRef<HTMLAudioElement | null>(null);

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

  const roleName = user?.role?.name;

  // Filtrer les éléments de menu en fonction du rôle
  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (roleName === "STUDENT_MANAGER") {
      return item.label === "Messagerie";
    }
    if (["SECRETARY", "QUALITY_OFFICER"].includes(roleName) && item.label === "Messagerie") {
      return false;
    }
    return true;
  });

  useEffect(() => {
    notifAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3");
    notifAudioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!user?.role?.name || !["SUPERADMIN", "QUALITY_OFFICER", "SECRETARY", "STUDENT_MANAGER"].includes(user.role.name)) {
      return;
    }

    let mounted = true;
    const storageKey = "admin_sidebar_notif_state_v1";

    const pollNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/summary", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const total = Number(data?.total || 0);
        const unreadMessages = Number(data?.unreadMessages || 0);
        const latestAt = typeof data?.latestAt === "string" ? data.latestAt : null;

        if (!mounted) return;
        setAdminNotifCount(total);

        if (!notifInitializedRef.current) {
          try {
            const cached = sessionStorage.getItem(storageKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              prevNotifCountRef.current = Number(parsed?.total || total);
              prevUnreadCountRef.current = Number(parsed?.unreadMessages || unreadMessages);
              lastMessageAtRef.current = parsed?.latestAt || latestAt;
            } else {
              prevNotifCountRef.current = total;
              prevUnreadCountRef.current = unreadMessages;
              lastMessageAtRef.current = latestAt;
            }
          } catch {
            prevNotifCountRef.current = total;
            prevUnreadCountRef.current = unreadMessages;
            lastMessageAtRef.current = latestAt;
          }
          notifInitializedRef.current = true;
          return;
        }

        const hasNewUnread = unreadMessages > prevUnreadCountRef.current;
        const hasNewTimestamp =
          !!latestAt &&
          latestAt !== lastMessageAtRef.current &&
          unreadMessages > 0;

        if (hasNewUnread || hasNewTimestamp) {
          try {
            await notifAudioRef.current?.play();
          } catch {}

          if ("Notification" in window) {
            if (Notification.permission === "default") {
              await Notification.requestPermission();
            }
            if (Notification.permission === "granted") {
              new Notification("Travel Express", {
                body: "Nouvelles notifications admin (messages/dossiers).",
              });
            }
          }
        }

        prevNotifCountRef.current = total;
        prevUnreadCountRef.current = unreadMessages;
        lastMessageAtRef.current = latestAt;
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            total,
            unreadMessages,
            latestAt,
          })
        );
      } catch {}
    };

    pollNotifications();
    const id = setInterval(pollNotifications, 12000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user?.role?.name]);

  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setIsOpenMobile(true)}
        className="md:hidden fixed top-4 left-4 z-[100] p-3 bg-white border border-slate-100 shadow-2xl rounded-2xl text-slate-900 active:scale-95 transition-all"
        style={{ pointerEvents: 'auto' }}
      >
        <Menu size={24} />
      </button>

      {/* Overlay mobile */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99] md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white fixed md:sticky top-0 h-screen shrink-0 border-r border-slate-100 shadow-sm transition-all duration-300",
        isOpenMobile ? "left-0 w-72 z-[100]" : "-left-full md:left-0 md:z-50",
        isCollapsed ? "md:w-20" : "md:w-72"
      )}>
        {/* Toggle Button (desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-10 bg-white border border-slate-100 shadow-sm rounded-full p-1.5 text-slate-400 hover:text-blue-600 z-50 hover:shadow-md transition-all"
        >
          {isCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>} 
        </button>

        <div className={cn("flex flex-col h-full", isCollapsed ? "p-4" : "p-8")}> 
          {/* PROFILE SECTION */}
          <div className={cn("flex flex-col items-center mb-10 text-center transition-all duration-300", isCollapsed && "mb-8")}> 
            <div className={cn(
              "rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/30 transition-all duration-300",
              isCollapsed ? "h-10 w-10 mb-2" : "h-20 w-20 mb-4"
            )}> 
              <div className="h-full w-full rounded-[14px] bg-white p-1"> 
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`} 
                  alt="Avatar" 
                  className="h-full w-full rounded-[10px] bg-slate-50" 
                /> 
              </div> 
            </div> 
            {!isCollapsed && ( 
              <div className="animate-in fade-in zoom-in duration-300"> 
                <h3 className="font-bold text-slate-800 text-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-45">{user?.fullName?.split(' ')[0]}</h3> 
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Admin</p> 
              </div> 
            )} 
          </div> 

          <nav className="space-y-1 flex-1">
            {filteredMenuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 py-3 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm group relative overflow-hidden",
                    isCollapsed ? "justify-center px-0 w-full" : "px-4",
                    isActive
                      ? "text-blue-600 bg-blue-50 shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon size={isCollapsed ? 22 : 20} className={cn("shrink-0 transition-all duration-300", isActive && "fill-current opacity-20", !isActive && "group-hover:scale-110", isActive && isCollapsed && "fill-blue-600 opacity-100")}/>
                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300 origin-left",
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                  )}>
                    {item.label}
                  </span>
                  {item.label === "Messagerie" && adminNotifCount > 0 && (
                    <span className={cn(
                      "ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center",
                      isCollapsed && "absolute -top-1 -right-1 ml-0"
                    )}>
                      {adminNotifCount > 99 ? "99+" : adminNotifCount}
                    </span>
                  )}
                  {isActive && !isCollapsed && <div className="absolute right-0 h-6 w-1 bg-blue-600 rounded-l-full top-1/2 -translate-y-1/2"></div>}
                  {isActive && isCollapsed && <div className="absolute inset-0 bg-blue-100/20 rounded-xl -z-10"></div>}
                </Link>
              );
            })}
          </nav>

          {/* LOGOUT */} 
          <div className="pt-4 border-t border-slate-100 mt-auto"> 
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-4 py-3 rounded-xl cursor-pointer transition-colors font-bold text-sm text-red-500 hover:bg-red-50",
                isCollapsed ? "justify-center px-0" : "px-4"
              )}
              title="Se déconnecter"
            >
              <LogOut size={20} className="shrink-0"/>
              <span className={cn(
                "whitespace-nowrap transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
              )}>
                Déconnexion
              </span>
            </button>
          </div> 
        </div> 
      </aside> 
    </> 
  ); 
}
