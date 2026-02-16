
'use client';
import { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Filtrer les éléments de menu en fonction du rôle
  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.label === 'Messagerie') {
      // Afficher Messagerie pour tous les rôles admin sauf STUDENT
      // (SUPERADMIN, SECRETARY, QUALITY_OFFICER, STUDENT_MANAGER)
      const allowedRoles = ['SUPERADMIN', 'SECRETARY', 'QUALITY_OFFICER', 'STUDENT_MANAGER'];
      return allowedRoles.includes(user?.role?.name);
    }
    return true;
  });

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
                  {isActive && !isCollapsed && <div className="absolute right-0 h-6 w-1 bg-blue-600 rounded-l-full top-1/2 -translate-y-1/2"></div>}
                  {isActive && isCollapsed && <div className="absolute inset-0 bg-blue-100/20 rounded-xl -z-10"></div>}
                </Link>
              );
            })}
          </nav>

          {/* LOGOUT */} 
          <div className="pt-4 border-t border-slate-100 mt-auto"> 
            <form action={logoutAction}> 
              <button 
                type="submit" 
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
            </form> 
          </div> 
        </div> 
      </aside> 
    </> 
  ); 
}
