"use client";

import { updateApplicationStatusAction, rejectApplicationAction } from "@/actions/application.actions";
import { useState, useTransition } from "react";
import { Check, ChevronDown, Loader2, AlertTriangle, X, ShieldAlert, History } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT: { label: 'Brouillon', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  SUBMITTED: { label: 'Soumis', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  UNDER_REVIEW: { label: 'En Analyse', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  ACCEPTED: { label: 'Admis', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  JW202_RECEIVED: { label: 'JW202 Reçu', color: 'text-indigo-600', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  VISA_GRANTED: { label: 'Visa Obtenu', color: 'text-purple-600', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  FLIGHT_BOOKED: { label: 'Vol Réservé', color: 'text-cyan-600', bg: 'bg-cyan-50', dot: 'bg-cyan-400' },
  COMPLETED: { label: 'Terminé', color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-600' },
  REJECTED: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-600' },
};

export function ApplicationStatusControl({ id, currentStatus }: { id: string, currentStatus: string }) {
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.DRAFT;

    const handleSelect = (status: string) => {
        if (status === currentStatus) return;
        if (status === 'REJECTED') {
            setIsOpen(false);
            setIsRejectModalOpen(true);
            return;
        }

        startTransition(async () => {
            const result = await updateApplicationStatusAction(id, status);
            if (result?.success) setIsOpen(false);
        });
    };

    const handleConfirmRejection = () => {
        if (!rejectionReason.trim()) return;
        startTransition(async () => {
            const result = await rejectApplicationAction(id, rejectionReason);
            if (result?.success) {
                setIsRejectModalOpen(false);
                setRejectionReason("");
            }
        });
    };

    return (
        <>
            <div className="relative inline-block">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isPending}
                    className={cn(
                        "group flex items-center gap-4 pl-5 pr-4 py-3 rounded-2xl border-2 transition-all duration-300 shadow-sm",
                        isOpen ? "border-[#db9b16]/30 shadow-lg" : "border-slate-100 hover:border-slate-200",
                        config.bg
                    )}
                >
                    <div className="flex flex-col items-start">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Workflow Status</span>
                        <div className={cn("flex items-center gap-2 font-black text-xs uppercase tracking-tighter italic", config.color)}>
                            {isPending ? <Loader2 size={14} className="animate-spin" /> : <div className={cn("h-2 w-2 rounded-full animate-pulse", config.dot)} />}
                            {config.label}
                        </div>
                    </div>
                    <ChevronDown size={18} className={cn("transition-transform duration-500 text-slate-300", isOpen && "rotate-180 text-[#db9b16]")} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                        <div className="absolute left-0 top-full mt-3 w-64 bg-slate-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] overflow-hidden z-40 p-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="px-4 py-3 border-b border-white/5 mb-2">
                                <p className="text-[10px] font-black text-[#db9b16] uppercase tracking-widest flex items-center gap-2">
                                    <History size={12} />
                                    Mise à jour du flux
                                </p>
                            </div>
                            <div className="space-y-1">
                                {Object.entries(STATUS_CONFIG).map(([value, item]) => (
                                    <button
                                        key={value}
                                        onClick={() => handleSelect(value)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                                            value === currentStatus 
                                                ? "bg-white/10 text-white shadow-inner" 
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", item.dot)} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        {value === currentStatus && <Check size={14} className="text-[#db9b16]" strokeWidth={3} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* MODALE DE REJET PRESTIGE */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-red-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Décision de Rejet</h3>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Action irréversible sur le dossier</p>
                                </div>
                            </div>
                            <button onClick={() => setIsRejectModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex gap-4">
                                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                                <p className="text-xs font-bold text-red-900 leading-relaxed uppercase tracking-tight">
                                    Attention : Le rejet stoppera net toute procédure. Un email automatique sera envoyé à l'étudiant avec votre motif.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Justification Administrative</label>
                                <textarea 
                                    autoFocus
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Ex: Absence de certification bancaire ou documents non conformes..."
                                    className="w-full h-40 p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-red-500 focus:bg-white outline-none text-slate-900 font-bold text-sm shadow-inner transition-all resize-none"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={handleConfirmRejection}
                                    disabled={isPending || !rejectionReason.trim()}
                                    className="flex-[2] py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} strokeWidth={3} />}
                                    Confirmer l'expulsion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}