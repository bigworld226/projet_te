'use client'

import { registerAction } from "@/actions/auth.actions" 
import { useActionState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

const initialState = {
  error: '',
}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState)

  return (
    <div className="min-h-screen flex w-full font-sans selection:bg-[#db9b16] selection:text-white">
      
      {/* 🎨 SIDE BRANDING (Fond Bleu Indigo Conservé) */}
      <div className="hidden lg:flex w-1/2 bg-indigo-950 relative overflow-hidden items-center justify-center p-12">
         {/* Abstract shapes */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
         
         <div className="relative z-10 text-white max-w-lg">
            {/* Typographie Travel Express : font-black et couleur Or */}
            <h2 className="text-5xl font-black mb-6 tracking-tight leading-tight">
              Votre aventure <br />
              <span className="text-[#db9b16]">commence ici.</span>
            </h2>
            <p className="text-xl text-indigo-200 leading-relaxed font-medium">
              Créez votre espace personnel pour suivre l'avancée de vos démarches d'admission et de visa en temps réel.
            </p>
            
            <div className="mt-12 bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem]">
               <div className="flex items-center gap-5 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 text-xl shadow-sm">🛡️</div>
                  <div>
                     <div className="font-bold text-lg">Données Sécurisées</div>
                     <div className="text-sm text-white/50 font-medium">Vos documents sont chiffrés et protégés.</div>
                  </div>
               </div>
               <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-[#db9b16]/20 flex items-center justify-center text-[#db9b16] text-xl shadow-sm">⚡</div>
                  <div>
                     <div className="font-bold text-lg">Processus Accéléré</div>
                     <div className="text-sm text-white/50 font-medium">Gagnez des semaines sur vos délais d'admission.</div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 📝 FORM SECTION */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md space-y-8">
           <div className="text-center lg:text-left">
              {/* Logo Travel Express Style */}
              <Link href="/" className="inline-block mb-8 text-2xl font-black text-slate-900 tracking-tighter hover:opacity-80 transition-opacity">
                Travel <span className="text-[#db9b16]">Express</span>
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">Ouvrir un compte 📁</h1>
              <p className="text-slate-500 mt-2 font-medium">Dites-nous qui vous êtes pour commencer.</p>
           </div>

          <form action={formAction} className="space-y-5">
            
            <Input 
              label="Nom complet"
              name="fullName"
              placeholder="ex: Ouedraogo Jean"
              required
              className="bg-white focus:border-[#db9b16] focus:ring-[#db9b16]/10"
            />

            <Input 
              label="Email"
              name="email"
              type="email"
              placeholder="ex: jean@email.com"
              required
              className="bg-white focus:border-[#db9b16] focus:ring-[#db9b16]/10"
            />

            <Input 
              label="Téléphone / WhatsApp"
              name="phone"
              type="tel"
              placeholder="ex: +226 70 00 00 00"
              className="bg-white focus:border-[#db9b16] focus:ring-[#db9b16]/10"
            />

            <Input 
              label="Mot de passe"
              name="password"
              type="password"
              placeholder="Au moins 8 caractères"
              required
              minLength={6}
              className="bg-white focus:border-[#db9b16] focus:ring-[#db9b16]/10"
            />

            {state?.error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2 font-bold">
                <span className="text-lg">⚠️</span> {state.error}
              </div>
            )}

            {/* Utilisation du variant glow avec la couleur de la marque */}
            <Button 
              type="submit" 
              isLoading={isPending}
              variant="glow"
              size="lg"
              className="w-full shadow-[#db9b16]/20 font-bold"
            >
              Créer mon espace étudiant
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium">
             Déjà inscrit ?{' '}
            <Link href="/login" className="text-[#db9b16] hover:text-[#c48a14] font-black transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}