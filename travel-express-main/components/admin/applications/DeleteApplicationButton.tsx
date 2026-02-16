"use client";

import { deleteApplicationAction } from "@/actions/application.actions";
import { Loader2, Trash2, AlertTriangle, X, ShieldAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

interface DeleteApplicationButtonProps {
    applicationId: string;
    studentName?: string | null;
}

export function DeleteApplicationButton({ applicationId, studentName }: DeleteApplicationButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteApplicationAction(applicationId);
                setShowConfirm(false);
            } catch (error) {
                console.error("Erreur de suppression", error);
            }
        });
    };

    return (
        <>
            {/* BOUTON DÉCLENCHEUR */}
            <button 
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
                className="group h-11 w-11 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300"
                title="Supprimer le dossier"
            >
                {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                )}
            </button>

            {/* MODALE DE SUPPRESSION NIVEAU CRITIQUE */}
            {showConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-[0_0_100px_rgba(220,38,38,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        {/* HEADER DE DANGER */}
                        <div className="p-8 bg-red-600 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Trash2 size={100} strokeWidth={3} />
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="h-16 w-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center mb-4 backdrop-blur-xl border border-white/30">
                                    <ShieldAlert size={32} />
                                </div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Zone Critique</h3>
                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em] mt-1">Autorisation de suppression</p>
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="text-center space-y-3">
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                    Vous êtes sur le point de purger définitivement le dossier de :
                                </p>
                                <div className="inline-block px-6 py-2 bg-slate-100 rounded-full">
                                    <span className="text-slate-900 font-black uppercase italic tracking-widest text-xs">
                                        {studentName || "Étudiant Inconnu"}
                                    </span>
                                </div>
                                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest pt-2 flex items-center justify-center gap-2">
                                    <AlertTriangle size={12} />
                                    Cette action détruira tous les documents liés
                                </p>
                            </div>

                            {/* ACTIONS FINALES */}
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    {isPending ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
                                    Confirmer la purge
                                </button>
                                
                                <button 
                                    onClick={() => setShowConfirm(false)}
                                    className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
                                >
                                    Annuler l'opération
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}