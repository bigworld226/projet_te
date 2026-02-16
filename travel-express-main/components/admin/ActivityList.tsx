'use client';

import { useState } from "react";
import { 
  Bell, FileText, CheckCircle, UserPlus, FileCheck, 
  XCircle, ArrowUpCircle, X, Calendar as CalendarIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityItem = {
   id: string;
   type: 'APP_NEW' | 'APP_UPDATE' | 'DOC_NEW' | 'DOC_VERIFIED' | 'DOC_REJECTED' | 'PAYMENT_NEW' | 'PAYMENT_UPDATE';
   title: string;
   description: string;
   date: Date;
   user: string;
   color?: string;
};

const ICONS: Record<string, any> = {
   'APP_NEW': UserPlus,
   'APP_UPDATE': ArrowUpCircle,
   'DOC_NEW': FileText,
   'DOC_VERIFIED': FileCheck,
   'DOC_REJECTED': XCircle,
   'PAYMENT_NEW': CheckCircle,
   'PAYMENT_UPDATE': ArrowUpCircle
};

const TYPE_THEMES: Record<string, { bg: string, text: string, iconBg: string }> = {
   'APP_NEW': { bg: 'bg-blue-500', text: 'text-blue-600', iconBg: 'bg-blue-50' },
   'APP_UPDATE': { bg: 'bg-sky-500', text: 'text-sky-600', iconBg: 'bg-sky-50' },
   'DOC_NEW': { bg: 'bg-purple-500', text: 'text-purple-600', iconBg: 'bg-purple-50' },
   'DOC_VERIFIED': { bg: 'bg-emerald-500', text: 'text-emerald-600', iconBg: 'bg-emerald-50' },
   'DOC_REJECTED': { bg: 'bg-red-500', text: 'text-red-600', iconBg: 'bg-red-50' },
   'PAYMENT_NEW': { bg: 'bg-amber-500', text: 'text-amber-600', iconBg: 'bg-amber-50' },
   'PAYMENT_UPDATE': { bg: 'bg-orange-500', text: 'text-orange-600', iconBg: 'bg-orange-50' },
};

export function ActivityList({ initialActivities }: { initialActivities: ActivityItem[] }) {
  const [filter, setFilter] = useState<'ALL' | 'APP' | 'DOC' | 'PAYMENT'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filteredItems = initialActivities.filter(item => {
    const matchType = 
       filter === 'ALL' ? true :
       filter === 'APP' ? item.type.startsWith('APP') :
       filter === 'DOC' ? item.type.startsWith('DOC') :
       filter === 'PAYMENT' ? item.type.startsWith('PAYMENT') : true;

    if (!matchType) return false;

    if (dateFilter) {
       const itemDate = new Date(item.date).toISOString().split('T')[0];
       return itemDate === dateFilter;
    }
    return true;
  });

  const grouped = filteredItems.reduce((acc, item) => {
     const dateKey = new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
     if (!acc[dateKey]) acc[dateKey] = [];
     acc[dateKey].push(item);
     return acc;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <div className="max-w-4xl mx-auto">
        {/* HEADER FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/50">
                {(['ALL', 'APP', 'DOC', 'PAYMENT'] as const).map((t) => (
                    <button 
                        key={t}
                        onClick={() => setFilter(t)}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {t === 'ALL' ? 'Flux global' : t === 'APP' ? 'Dossiers' : t === 'DOC' ? 'Documents' : 'Paiements'}
                    </button>
                ))}
            </div>

            <div className="relative group">
                <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm group-hover:border-[#db9b16]/50 transition-all">
                    <CalendarIcon size={16} className="text-slate-400 group-hover:text-[#db9b16]" />
                    <input 
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="outline-none text-slate-700 font-bold bg-transparent text-xs uppercase"
                    />
                    {dateFilter && (
                        <button onClick={() => setDateFilter('')} className="text-slate-300 hover:text-red-500">
                            <X size={14} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* TIMELINE CONTENT */}
        <div className="relative">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-16 last:mb-0">
               <h3 className="font-black text-slate-300 text-[10px] uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                    <span className="shrink-0">{date}</span>
                    <div className="h-px w-full bg-slate-100"></div>
               </h3>
               
               <div className="space-y-0 relative ml-6">
                  {/* Vertical line with gradient */}
                  <div className="absolute left-0 top-2 bottom-2 w-px bg-linear-to-b from-slate-200 via-slate-100 to-transparent"></div>

                  {items.map((item) => {
                      const Icon = ICONS[item.type] || Bell;
                      const theme = TYPE_THEMES[item.type] || { bg: 'bg-slate-400', text: 'text-slate-500', iconBg: 'bg-slate-50' };
                      
                      return (
                      <div key={item.id} className="relative pl-10 pb-10 last:pb-0 group">
                         {/* Timeline Dot */}
                         <div className={cn(
                             "absolute -left-1.25 top-6 h-2.5 w-2.5 rounded-full border-2 border-white ring-4 ring-white shadow-sm transition-all duration-500 group-hover:scale-150",
                             theme.bg
                         )}></div>
                         
                         <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 flex items-start gap-5">
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6", theme.iconBg, theme.text)}>
                               <Icon size={26} strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start gap-4">
                                  <h4 className="font-black text-slate-900 text-sm uppercase leading-tight tracking-tight truncate">{item.title}</h4>
                                  <time className="text-[10px] font-black text-slate-300 font-mono bg-slate-50 px-2 py-1 rounded-md">
                                     {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </time>
                               </div>
                               <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{item.description}</p>
                               
                               <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                  <div className="h-6 w-6 rounded-lg bg-[#db9b16]/10 flex items-center justify-center overflow-hidden border border-white">
                                     <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.user}`} alt="User" className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{item.user}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                  )})}
               </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-300 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                 <Bell size={48} className="mb-4 opacity-20" />
                 <p className="font-black uppercase tracking-widest text-xs">Aucune activité enregistrée</p>
              </div>
          )}
        </div>
    </div>
  );
}