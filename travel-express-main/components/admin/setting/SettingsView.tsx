'use client';

import { useState, useEffect } from 'react';
import { 
  User, Shield, Lock, Banknote 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AdminManagement, 
  ProfileSettings, 
  FeesSettings, 
  SecuritySettings 
} from '@/components/admin/setting';

export function SettingsView({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('profile');
  
  const isSuperAdmin = user?.role?.name === 'SUPERADMIN';

  // Configuration des onglets - filtré par rôle
  const settingItems = [
    { id: 'profile', label: 'Mon Profil', icon: User, section: 'account', superAdminOnly: false },
    { id: 'security', label: 'Mot de passe', icon: Lock, section: 'account', superAdminOnly: false },
    { id: 'admins', label: 'Équipe Admin', icon: Shield, section: 'admin', superAdminOnly: true },
    { id: 'fees', label: 'Frais de dossier', icon: Banknote, section: 'admin', superAdminOnly: true },
  ].filter(item => !item.superAdminOnly || isSuperAdmin);

  useEffect(() => {
    console.log("Données utilisateur chargées:", user);
  }, [user]);

  return (
    <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-80 shrink-0 space-y-2">
        <div className="px-6 mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Configuration</h3>
        </div>
        
        {settingItems.map((item, index) => {
          const prevSection = index > 0 ? settingItems[index - 1].section : null;
          const showSeparator = prevSection && prevSection !== item.section;
          
          return (
            <div key={item.id}>
              {showSeparator && <div className="h-px bg-slate-100 my-4 mx-6" />}
              
              <TabButton 
                active={activeTab === item.id} 
                onClick={() => setActiveTab(item.id)} 
                icon={item.icon} 
                label={item.label} 
              />
            </div>
          );
        })}
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 min-h-[780px] relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -z-10 opacity-50" />
        
        {/* Rendu conditionnel élégant */}
        <div className="transition-all duration-300">
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'admins' && <AdminManagement />}
          {activeTab === 'fees' && <FeesSettings />}
        </div>
      </main>
    </div>
  );
}

// --- COMPOSANT TABBUTTON ---

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 group relative",
        active 
          ? "bg-slate-900 text-white shadow-xl shadow-slate-300 translate-x-3" 
          : "bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:translate-x-1"
      )}
    >
      <div className="flex items-center gap-4 relative z-10">
        <Icon 
          size={18} 
          className={cn(
            "transition-colors duration-300", 
            active ? "text-[#db9b16]" : "group-hover:text-slate-900"
          )} 
        />
        {label}
      </div>
      
      {active && (
        <div className="flex items-center text-[#db9b16]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#db9b16] mr-2 animate-pulse" />
        </div>
      )}
    </button>
  );
}
