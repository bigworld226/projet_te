"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Globe, ShieldCheck, Zap, ArrowRight, Star, GraduationCap, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { 
    id: "china", 
    name: "Chine", 
    icon: "🇨🇳", 
    tag: "Bourses Disponibles",
    image: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80",
    description: "L'excellence académique alliée à la puissance technologique de l'Asie." 
  },
  { 
    id: "spain", 
    name: "Espagne", 
    icon: "🇪🇸", 
    tag: "Business & Art",
    image:"https://th.bing.com/th/id/R.4acc07f5fd4dc76d60451910cf3f50fa?rik=VgsfPowzzFxJRw&riu=http%3a%2f%2fwww.voyagetips.com%2fwp-content%2fuploads%2f2017%2f06%2fBarcelone.jpg&ehk=3eAhNoNJhAjax3D0hHfozLItmFAb%2f8Gx1xRBpM3aIrA%3d&risl=&pid=ImgRaw&r=0",
    description: "Un cadre de vie unique pour des diplômes reconnus dans l'Union Européenne." 
  },
  { 
    id: "germany", 
    name: "Allemagne", 
    icon: "🇩🇪", 
    tag: "Ingénierie & Tech",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    description: "La rigueur et l'innovation au sein de la première puissance économique d'Europe." 
  }
];

export default function HomeClient({ isConnected }: { isConnected: boolean }) {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (blobRef.current) {
        const { clientX, clientY } = e;
        blobRef.current.animate({
          left: `${clientX}px`,
          top: `${clientY}px`
        }, { duration: 3000, fill: "forwards" });
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#db9b16]/30">
      {/* 🌌 HERO SECTION AVEC BLOB INTERACTIF */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(219,155,22,0.05)_0%,_rgba(255,255,255,1)_100%)]" />
        <div ref={blobRef} className="absolute h-96 w-96 bg-blue-400/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
              {/*<Navbar isConnected={isConnected} /> 🌌 HERO SECTION AVEC BLOB INTERACTIF */}

        
        
        <div className="container mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <GraduationCap className="w-4 h-4 text-[#db9b16]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Admissions 2025-2026 Ouvertes</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter mb-8 leading-[0.9] italic">
            Propulsez votre <br />
            <span className="text-[#db9b16] relative">
              Avenir Global
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 20" fill="none"><path d="M5 15C50 5 150 5 295 15" stroke="#db9b16" strokeWidth="8" strokeLinecap="round"/></svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Travel Express vous ouvre les portes des plus grandes facultés mondiales. 
            Une expertise locale pour une ambition internationale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="#destinations">
              <Button className="px-10 py-8 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-[#db9b16] transition-all hover:scale-105 shadow-2xl shadow-slate-200">
                Explorer les programmes
              </Button>
            </Link>
            {!isConnected && (
              <Link href="/auth/register">
                <Button variant="ghost" className="text-slate-900 font-black uppercase tracking-widest flex items-center gap-3 group">
                  Créer un compte <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 🌍 DESTINATIONS : GRID ÉLITE */}
      <main id="destinations" className="container mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="h-1 w-12 bg-[#db9b16]" />
               <span className="text-xs font-black uppercase tracking-[0.3em] text-[#db9b16]">Explorez le monde</span>
            </div>
            <h2 className="text-5xl font-black text-slate-950 uppercase italic tracking-tighter">Nos Destinations</h2>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-[200px]">
            Sélectionnées pour leur prestige académique et leurs opportunités post-études.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {COUNTRIES.map((country) => (
            <div key={country.id} className="group relative">
              <div className="relative h-[500px] w-full rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 group-hover:shadow-[#db9b16]/10">
                <img src={country.image} alt={country.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
                
                {/* Overlay Dégradé */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                {/* Badge pays */}
                <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3 text-white">
                  <span className="text-xl">{country.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{country.tag}</span>
                </div>

                {/* Contenu textuel sur l'image */}
                <div className="absolute bottom-10 left-10 right-10">
                  <h3 className="text-4xl font-black text-white italic mb-4 uppercase tracking-tighter">Étudier en {country.name}</h3>
                  <p className="text-white/70 mb-8 text-sm font-medium line-clamp-2">{country.description}</p>
                  
                  <Link href={`/student/apply?country=${country.name}`}>
                    <Button className="w-full bg-[#db9b16] text-slate-950 rounded-2xl py-7 font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex items-center justify-center gap-3">
                      Lancer mon dossier <Compass className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

{/* 🚀 TRUST SECTION : L'AUTORITÉ RÉINVENTÉE (MODE LUMIÈRE) */}
      <section className="bg-white py-32 relative overflow-hidden">
        {/* Motif de fond subtil (Dots) au lieu du noir */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#db9b16 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
        
        {/* Blobs de couleur très légers pour la profondeur */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -z-10" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#db9b16]/5 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            {[
              { 
                icon: ShieldCheck, 
                title: "Visa Garanti", 
                desc: "Un taux de réussite de 98% sur l'accompagnement consulaire et administratif.",
                accent: "text-blue-600",
                bg: "bg-blue-50"
              },
              { 
                icon: Globe, 
                title: "Réseau Global", 
                desc: "Accès exclusif à plus de 150 universités partenaires de rang mondial.",
                accent: "text-[#db9b16]",
                bg: "bg-[#db9b16]/10"
              },
              { 
                icon: Zap, 
                title: "Suivi Live", 
                desc: "Notification instantanée et suivi en temps réel de chaque étape de votre dossier.",
                accent: "text-emerald-600",
                bg: "bg-emerald-50"
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center group p-8 rounded-[3rem] hover:bg-white hover:shadow-[0_30px_100px_rgba(0,0,0,0.06)] transition-all duration-500 border border-transparent hover:border-slate-100">
                {/* Icône stylisée */}
                <div className={cn(
                  "h-24 w-24 rounded-[2.5rem] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
                  feature.bg
                )}>
                  <feature.icon size={40} strokeWidth={1.5} className={feature.accent} />
                </div>

                {/* Texte plus lisible */}
                <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 group-hover:text-[#db9b16] transition-colors">
                  {feature.title}
                </h4>
                
                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] font-medium italic">
                  "{feature.desc}"
                </p>

                {/* Petit indicateur de progression décoratif */}
                <div className="mt-8 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="h-1 w-8 bg-[#db9b16] rounded-full" />
                  <div className="h-1 w-2 bg-slate-200 rounded-full" />
                  <div className="h-1 w-2 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-12 text-center border-t border-slate-50">
        <div className="flex items-center justify-center gap-2 mb-6 grayscale opacity-50">
           <Image src="/images/logo.png" alt="Travel Express" width={100} height={100}/>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} Travel Express — L'excellence sans frontières.
        </p>
      </footer>
    </div>
  );
}