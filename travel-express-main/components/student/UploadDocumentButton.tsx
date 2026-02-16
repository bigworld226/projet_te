'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { uploadDocumentAction } from "@/actions/document.actions";
import { X, UploadCloud, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Constantes partagées pour éviter les erreurs
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5Mo
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

export function UploadDocumentButton({ applicationId, className }: { applicationId: string; className?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      // 1. Validation Taille
      if (selectedFile.size > MAX_FILE_SIZE) {
        setErrorMsg("Fichier trop volumineux (Max 5Mo)");
        clearFile();
        return;
      }

      // 2. Validation Extension (plus fiable que le Type MIME qui varie selon les OS)
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        setErrorMsg("Format non supporté. Utilisez PDF, JPG ou PNG.");
        clearFile();
        return;
      }

      setFile(selectedFile);
    }
  };

  const onFormSubmit = async (formData: FormData) => {
    if (!file) return;
    
    setErrorMsg(null);
    setIsPending(true);
    
    try {
      // On s'assure que les données sont bien présentes
      formData.set('applicationId', applicationId);
      formData.set('file', file); 

      const result = await uploadDocumentAction(formData);

      if (result?.error) {
        setErrorMsg(result.error);
        toast.error(result.error);
      } else {
        toast.success("Document envoyé avec succès");
        setIsOpen(false);
        setFile(null);
        
        // Rafraîchissement intelligent
        router.refresh(); 
      }
    } catch (e) {
      setErrorMsg("Échec de la connexion au serveur.");
    } finally {
      setIsPending(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full font-black uppercase tracking-widest bg-slate-900 hover:bg-[#db9b16] text-white transition-all py-7 rounded-2xl shadow-xl group",
          className
        )}
      >
        <UploadCloud className="mr-2 group-hover:animate-bounce" size={20} /> 
        Ajouter un document
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-xl text-slate-900">Nouveau document</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Dossier #{applicationId.slice(-6).toUpperCase()}
                </p>
              </div>
              <button 
                onClick={() => !isPending && setIsOpen(false)} 
                className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
                disabled={isPending}
              >
                <X size={20} />
              </button>
            </div>

            <form action={onFormSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Type de document
                </label>
                <div className="relative">
                  <select 
                    name="type" 
                    required 
                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-900 focus:border-[#db9b16] focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
                    disabled={isPending}
                  >
                    <option value="PASSPORT">Passeport</option>
                    <option value="DIPLOMA">Diplôme / Relevé</option>
                    <option value="CV">CV / Lettre</option>
                    <option value="MEDICAL">Certificat Médical</option>
                    <option value="OTHER">Autre</option>
                  </select>
                  <FileText className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div 
                onClick={() => !isPending && fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-[2.5rem] p-10 text-center transition-all cursor-pointer",
                  file ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-[#db9b16]",
                  isPending && "opacity-60 cursor-not-allowed"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.webp" 
                  onChange={handleFileChange} 
                />
                
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all",
                  file ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {isPending ? <Loader2 className="animate-spin" size={28} /> : file ? <Check size={28} /> : <UploadCloud size={28} />}
                </div>

                <div className="text-sm font-black text-slate-900 truncate">
                  {file ? file.name : "Choisir un fichier"}
                </div>
                
                {file && !isPending && (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="mt-2 text-[10px] font-bold text-red-500 uppercase underline"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold">{errorMsg}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-[#db9b16] text-white py-8 rounded-2xl font-black uppercase tracking-widest shadow-lg disabled:bg-slate-200"
                disabled={!file || isPending}
              >
                {isPending ? "Téléchargement..." : "Envoyer le document"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}