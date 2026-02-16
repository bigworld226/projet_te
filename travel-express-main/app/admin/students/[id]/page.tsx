"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// Imports UI & Icônes
import { 
  Eye, MapPin, Calendar, Phone, Mail, 
  FileText, Activity, ChevronLeft, Wallet,
  AlertCircle, CreditCard, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button"; 

// Services (Assurez-vous que ce fichier existe)
import { convertToXOF, Currency } from "@/services/currency.service"; 

// --- TYPES (Pour la sécurité du code) ---
interface Payment {
  status: string;
  amount: number;
  currency: string;
}

interface Application {
  id: string;
  country?: string;
  university?: { name: string };
  status: string;
  applicationFee: number;
  payments?: Payment[];
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  passportNumber?: string;
  createdAt: string;
  specificDiseases?: string[];
  applications?: Application[];
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params?.id as string; // Sécurisation de l'ID
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAllData() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/admin/students/${id}`);
        setStudent(res.data.user);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des informations de l'étudiant");
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
         <Loader2 className="animate-spin text-blue-600" size={40} />
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Analyse du profil...</p>
       </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
            <AlertCircle />
            <span className="font-bold">{error}</span>
        </div>
    </div>
  );

  if (!student) return <div className="p-12 text-center text-slate-400">Aucun étudiant trouvé.</div>;

  return (
    <main className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* NAVIGATION */}
      <div className="mb-8 flex justify-between items-center">
        <Link href="/admin/students" className="text-slate-400 hover:text-slate-900 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
          <ChevronLeft size={16} /> Retour à l'annuaire
        </Link>
        <Button variant="outline" className="rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200">
          Modifier les infos
        </Button>
      </div>

      {/* --- CARTE PROFIL --- */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-10 mb-12">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Avatar / Initiales */}
          <div className="w-32 h-32 shrink-0 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-slate-200 relative">
             {student.fullName?.charAt(0).toUpperCase() || '?'}
             <div className="absolute -bottom-1 -right-1 bg-emerald-500 h-8 w-8 rounded-full border-[6px] border-white"></div>
          </div>
          
          <div className="flex-1 w-full">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight italic">
                {student.fullName}
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
              <InfoItem icon={Mail} label="Contact Email" value={student.email} />
              <InfoItem icon={Phone} label="Ligne Directe" value={student.phone || "Non renseigné"} />
              <InfoItem icon={FileText} label="Numéro Passeport" value={student.passportNumber || "Non renseigné"} highlight />
              <InfoItem 
                icon={Calendar} 
                label="Date d'inscription" 
                value={student.createdAt ? new Date(student.createdAt).toLocaleDateString('fr-FR') : 'N/A'} 
              />
            </div>
            
            {student.specificDiseases && student.specificDiseases.length > 0 && (
              <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                  <Activity size={20} />
                </div>
                <p className="text-xs text-red-800 font-black uppercase tracking-tight">
                  Alerte Médicale : {student.specificDiseases.join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- DOSSIERS --- */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-yellow-500 rounded-full"></div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Candidatures en cours</h2>
        </div>
        <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">
          {student.applications?.length || 0} Dossiers consolidés
        </span>
      </div>

      <div className="space-y-10">
        {(!student.applications || student.applications.length === 0) ? (
          <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
            <Wallet className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aucun dossier actif pour cet étudiant</p>
          </div>
        ) : (
          student.applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))
        )}
      </div>
    </main>
  );
}

// --- SOUS-COMPOSANTS ---

function ApplicationCard({ app }: { app: Application }) {
    // Dans ton fichier ApplicationCard (le composant Client)
  const finances = useMemo(() => {
    const mainCurrency = "XOF";
    const totalsByCurrency: Record<string, number> = {};
    let totalPaidInXOF = 0;

    app.payments?.forEach((p: any) => {
      if (p.status === 'SUCCESS' || p.status === 'APPROVED') {
        // 🔴 ERREUR PRÉCÉDENTE : p.amount pouvait être une String via l'API
        // ✅ CORRECTION : Forcer en Number
        const amount = Number(p.amount) || 0; 
        const currency = (p.currency || mainCurrency) as Currency;

        totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + amount;
        totalPaidInXOF += convertToXOF(amount, currency);
      }
    });

    const feeInXOF = Number(app.applicationFee) || 0; // Sécurité ici aussi
    const remainsXOF = Math.max(0, feeInXOF - totalPaidInXOF);

    return { 
      totalEquivalentPaidXOF: totalPaidInXOF,
      remainsXOF, 
      extraPayments: Object.entries(totalsByCurrency).filter(([cur]) => cur !== mainCurrency), 
      mainCurrency 
    };
  }, [app.payments, app.applicationFee]);

  // Sécurisation de l'affichage du pays pour éviter le crash sur toUpperCase()
  const countryCode = app.country ? app.country.substring(0, 2).toUpperCase() : '??';
  const countryName = app.country || 'Pays inconnu';

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-blue-100">
      <div className="p-8 flex flex-col md:flex-row justify-between gap-8 items-center">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">
            {countryCode}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{countryName}</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 mt-1">
              <MapPin size={12} className="text-blue-500" /> {app.university?.name || "Université non assignée"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <StatusBadge status={app.status} />
          <Link href={`/admin/applications/${app.id}`}>
            <Button variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-slate-50 hover:bg-slate-100 h-10 px-6">
              Voir le dossier
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-[#fcfcfd] p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-50">
        {/* Box 1 : Frais */}
        <FinanceBox 
          label="Frais de Dossier" 
          amount={app.applicationFee} 
          currency="FCFA" 
          color="text-slate-900" 
        />
        
        {/* Box 2 : Total Payé */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Total perçu (Valeur XOF)</p>
          <div className="text-2xl font-black italic text-emerald-600">
            {finances.totalEquivalentPaidXOF.toLocaleString('fr-FR')} 
            <span className="text-[10px] not-italic ml-2 font-bold opacity-30 text-slate-400">FCFA</span>
          </div>

          {/* Affichage des devises additionnelles */}
          <div className="space-y-2 mt-3">
            {finances.extraPayments.map(([cur, amt]) => (
                <div key={cur} className="flex items-center justify-between text-blue-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                <div className="flex items-center gap-2">
                    <CreditCard size={12} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">{cur}</span>
                </div>
                <span className="text-xs font-black">+{amt.toLocaleString('fr-FR')}</span>
                </div>
            ))}
          </div>
        </div>

        {/* Box 3 : Reste à payer */}
        <FinanceBox 
          label="Somme Restante" 
          amount={finances.remainsXOF} 
          currency="FCFA" 
          color={finances.remainsXOF > 0 ? "text-red-500" : "text-emerald-500"}
          highlight={finances.remainsXOF > 0}
        />
      </div>
    </div>
  );
}

// --- PETITS COMPOSANTS UI ---

interface FinanceBoxProps {
    label: string;
    amount: number;
    currency: string;
    color: string;
    highlight?: boolean;
}

function FinanceBox({ label, amount, currency, color, highlight }: FinanceBoxProps) {
  return (
    <div className={`bg-white p-6 rounded-[2rem] border ${highlight ? 'border-red-100 bg-red-50/10' : 'border-slate-100'} shadow-sm flex flex-col justify-center`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <div className={`text-2xl font-black italic tracking-tighter ${color}`}>
        {amount?.toLocaleString('fr-FR') || 0} 
        <span className="text-[10px] not-italic ml-2 font-bold opacity-30 text-slate-400">{currency}</span>
      </div>
    </div>
  );
}

interface InfoItemProps {
    icon: React.ElementType;
    label: string;
    value: string;
    highlight?: boolean;
}

function InfoItem({ icon: Icon, label, value, highlight }: InfoItemProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className={`text-sm font-bold tracking-tight break-all ${highlight ? 'text-blue-600 underline underline-offset-4 decoration-blue-200' : 'text-slate-700'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'DRAFT': "bg-slate-100 text-slate-500 border-slate-200",
    'SUBMITTED': "bg-blue-50 text-blue-600 border-blue-100",
    'UNDER_REVIEW': "bg-amber-50 text-amber-600 border-amber-100",
    'APPROVED': "bg-emerald-50 text-emerald-600 border-emerald-100", // Ajouté APPROVED souvent utilisé
    'ACCEPTED': "bg-emerald-50 text-emerald-600 border-emerald-100",
    'REJECTED': "bg-red-50 text-red-600 border-red-100",
  };
  
  const currentStatus = status || 'DRAFT';

  return (
    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm whitespace-nowrap ${styles[currentStatus] || styles['DRAFT']}`}>
      {currentStatus.replace(/_/g, ' ')}
    </span>
  );
}