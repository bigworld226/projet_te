import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { 
  ArrowLeft, 
  MapPin, 
  Globe, 
  Wallet, 
  BookOpen, 
  FileText, 
  Download,
  School
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return notFound();

  const university = await prisma.university.findUnique({ where: { id } });
  if (!university) return notFound();

  // On récupère toutes les images disponibles
  const allImages = university.images || [];

  return (
    <main className="min-h-screen bg-[#fcfcfd] pb-20">
      {/* Top Bar - Navigation */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/admin/universities" 
            className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em]"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Retour Catalogue
          </Link>
          <div className="flex gap-4">
            <Link 
              href={`/admin/universities/${id}/edit`}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
            >
              Modifier la fiche
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <School size={24} />
            <span className="h-px w-12 bg-blue-100"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{university.country}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
            {university.name}
          </h1>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <MapPin size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-slate-600">{university.city}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <Globe size={14} className="text-slate-300" />
              <span className="text-xs font-bold text-slate-600 italic">Institution Agréée</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Colonne Gauche - Contenu principal */}
          <div className="lg:col-span-2 space-y-10">
            {/* Galerie d'images */}
            <section className="grid grid-cols-2 gap-4">
              {allImages.length > 0 ? (
                allImages.map((img, idx) => (
                  <div key={idx} className={`relative overflow-hidden rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 ${idx === 0 ? 'col-span-2 h-[400px]' : 'h-[250px]'}`}>
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 h-[300px] bg-slate-100 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aucun visuel disponible</p>
                </div>
              )}
            </section>

            {/* Description détaillée */}
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2">
                <FileText size={14} /> À propos de l'établissement
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                {university.description || "Aucune description détaillée n'a été fournie pour cette institution."}
              </p>
            </section>
          </div>

          {/* Colonne Droite - Sidebar Infos */}
          <aside className="space-y-6">
            {/* Carte Budget */}
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
              <div className="relative z-10">
                <Wallet className="mb-4 opacity-50" size={24} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Budget Estimé</h3>
                <p className="text-2xl font-bold tracking-tight mb-1">{university.costRange || "Sur demande"}</p>
                <p className="text-[10px] opacity-60 italic">Inclus frais de scolarité & logement estimé.</p>
              </div>
              <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            </div>

            {/* Carte Programmes */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <BookOpen size={14} className="text-blue-500" /> Domaines d'études
              </h3>
              <div className="flex flex-wrap gap-2">
                {university.programs?.split(',').map((p, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-100">
                    {p.trim()}
                  </span>
                )) || <span className="text-slate-400 italic text-xs">Nous contacter pour la liste</span>}
              </div>
            </div>

            {/* Document PDF */}
            {university.pdfUrl && (
              <a 
                href={university.pdfUrl} 
                target="_blank" 
                className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-blue-700 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                    <Download size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Brochure & Bourses</p>
                    <p className="text-xs font-bold">Consulter le PDF</p>
                  </div>
                </div>
              </a>
            )}

            {/* Résumé rapide */}
            <div className="p-8 border border-slate-100 rounded-[2.5rem] bg-slate-50/50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Note de l'agence</h3>
              <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                "{university.summary}"
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}