'use client';

import { useEffect, useState, useTransition } from 'react';
import { getAdminsAction, getAllUsersAction, updateUserRoleAction } from '@/actions/auth.actions';
import { Search, UserPlus, X, Trash2, Loader2, ShieldCheck, User as UserIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDebounce } from "@/hooks/use-deboubce";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Rôles admin disponibles pour l'élévation (SUPERADMIN peut choisir)
const ADMIN_ROLES = [
  { name: 'STUDENT_MANAGER', label: 'Gestionnaire Étudiants', description: 'Gère les dossiers étudiants', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'QUALITY_OFFICER', label: 'Responsable Qualité', description: 'Valide les documents', color: 'bg-green-50 text-green-700 border-green-200' },
  { name: 'SECRETARY', label: 'Secrétaire', description: 'Discussions et suivi', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'FINANCE_MANAGER', label: 'Gestionnaire Finances', description: 'Gestion financière', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { name: 'SUPERADMIN', label: 'Super Administrateur', description: 'Accès complet au système', color: 'bg-red-50 text-red-700 border-red-200' },
];

const AdminManagement = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState('STUDENT_MANAGER');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminList, userList] = await Promise.all([
        getAdminsAction(),
        getAllUsersAction()
      ]);
      setAdmins(adminList);
      setAllUsers(userList);
    } catch (error) {
      toast.error("Erreur de synchronisation des comptes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateRole = (userId: string, roleName: string, name: string) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, roleName);
      if (res.success) {
        const roleLabel = roleName === 'STUDENT' 
          ? 'Utilisateur' 
          : ADMIN_ROLES.find(r => r.name === roleName)?.label || roleName;
        toast.success(`${name} est maintenant ${roleLabel}`);
        setShowPicker(false);
        setSelectedUserId(null);
        setSelectedRole('STUDENT_MANAGER');
        loadData();
      } else {
        toast.error(res.error || "Action impossible");
      }
    });
  };

  const filteredUsers = allUsers.filter(u => 
    (u.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
     u.email?.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
    u.role?.name === 'STUDENT'
  );

  function getRoleBadge(roleName: string) {
    const role = ADMIN_ROLES.find(r => r.name === roleName);
    return role ? role.color : 'bg-slate-50 text-slate-600 border-slate-200';
  }

  function getRoleLabel(roleName: string) {
    const role = ADMIN_ROLES.find(r => r.name === roleName);
    return role ? role.label : roleName;
  }

  async function handleDeleteAdmin(id: any): Promise<void> {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer cet administrateur ?")) return;
    setLoading(true);
    try {
      const res = await updateUserRoleAction(id, 'STUDENT');
      if (res.success) {
        toast.success("Administrateur retiré avec succès.");
        loadData();
      } else {
        toast.error(res.error || "Impossible de retirer cet administrateur.");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'administrateur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-[#db9b16]" size={22} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Équipe Admin</h2>
          </div>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest ml-1">
            Contrôle des privilèges et accès système
          </p>
        </div>
        
        <Button 
          onClick={() => setShowPicker(true)}
          className="bg-[#db9b16] hover:bg-slate-900 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] h-14 px-8 transition-all shadow-lg shadow-[#db9b16]/20 active:scale-95"
        >
          <UserPlus size={18} className="mr-3" strokeWidth={3} /> Promouvoir Admin
        </Button>
      </header>

      {/* ADMINS TABLE / LIST */}
      <div className="grid gap-4">
        <div className="flex items-center gap-2 px-4 mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#db9b16] animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Administrateurs Actifs ({admins.length})</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-4xl p-20 flex flex-col items-center justify-center border border-slate-100">
             <Loader2 className="animate-spin text-[#db9b16] mb-4" size={40} strokeWidth={2.5} />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sécurisation de la liste...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
              {admins.map((admin) => (
                <div key={admin.id} className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 min-h-[100px] relative border border-slate-100 hover:shadow-lg transition-all">
                  {/* Avatar cercle avec initiale */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-[#db9b16] text-lg font-black shrink-0">
                    {admin.fullName?.[0]?.toUpperCase() || '?'}
                  </div>
                  {/* Infos admin */}
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-base italic tracking-tight text-slate-900 truncate">
                      {admin.fullName}
                    </div>
                    <div className="text-xs text-slate-400 font-bold truncate">{admin.email}</div>
                    <div className="mt-1">
                      {admin.role === 'SUPERADMIN' ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider">Super Administrateur</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">{ADMIN_ROLES.find(r => r.name === admin.role)?.label}</span>
                      )}
                    </div>
                  </div>
                  {/* Bouton suppression */}
                  {admin.role !== 'SUPERADMIN' && (
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="ml-2 text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-200"
                      title="Retirer cet admin"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}

              {showPicker && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-2">
                  <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 relative" style={{maxHeight:'90vh', display:'flex', flexDirection:'column'}}>
                    {/* Close button top right */}
                    <button
                      onClick={() => { setShowPicker(false); setSelectedUserId(null); setSelectedRole('STUDENT_MANAGER'); }}
                      className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-500 hover:text-white text-slate-400 transition-all z-10 border border-slate-200 shadow"
                      title="Fermer"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                    <div className="p-5 bg-slate-900 text-white flex justify-between items-center rounded-t-3xl">
                      <div>
                        <h3 className="font-black text-lg uppercase italic tracking-tighter">Nouveau Privilège</h3>
                        <p className="text-[#db9b16] text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Élévation de rôle utilisateur</p>
                      </div>
                    </div>
                    <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                      {/* SÉLECTEUR DE RÔLE */}
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">
                          Rôle à attribuer
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {ADMIN_ROLES.map(role => (
                            <button
                              key={role.name}
                              onClick={() => setSelectedRole(role.name)}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-xl border-2 transition-all text-left",
                                selectedRole === role.name
                                  ? "border-[#db9b16] bg-[#db9b16]/5 shadow-sm"
                                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              <div>
                                <p className={cn(
                                  "font-black text-[11px] uppercase tracking-wider",
                                  selectedRole === role.name ? "text-[#db9b16]" : "text-slate-700"
                                )}>
                                  {role.label}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">{role.description}</p>
                              </div>
                              {selectedRole === role.name && (
                                <div className="h-3 w-3 rounded-full bg-[#db9b16] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* RECHERCHE UTILISATEUR */}
                      <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#db9b16] transition-colors" size={18} />
                        <input 
                          autoFocus
                          placeholder="Chercher par nom ou email..."
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-[#db9b16]/20 focus:bg-white outline-none transition-all font-bold text-sm"
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-[#db9b16] transition-colors">
                                    <UserIcon size={16} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{user.fullName}</p>
                                    <p className="text-[9px] text-slate-400 font-bold tracking-tighter uppercase">{user.email}</p>
                                </div>
                            </div>
                            <button 
                              disabled={isPending}
                              onClick={() => handleUpdateRole(user.id, selectedRole, user.fullName)}
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all transform active:scale-95 disabled:opacity-50",
                                "bg-slate-900 text-white hover:bg-[#db9b16]"
                              )}
                            >
                              {isPending ? <Loader2 className="animate-spin" size={12} /> : `Nommer ${ADMIN_ROLES.find(r => r.name === selectedRole)?.label || 'Admin'}`}
                            </button>
                          </div>
                        )) : debouncedSearch.length >= 2 ? (
                          <div className="py-8 text-center opacity-40 italic font-bold text-slate-400 text-xs">
                            Aucun utilisateur ne correspond à votre recherche.
                          </div>
                        ) : (
                            <div className="py-8 text-center opacity-20">
                                <UserPlus size={32} className="mx-auto mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-[0.3em]">En attente de saisie...</p>
                            </div>
                        )}
                      </div>
                    </div>
                    {/* Annuler button sticky bottom */}
                    <div className="flex justify-end p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                      <button
                        onClick={() => { setShowPicker(false); setSelectedUserId(null); setSelectedRole('STUDENT_MANAGER'); }}
                        className="px-6 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold uppercase hover:bg-slate-50 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export default AdminManagement;