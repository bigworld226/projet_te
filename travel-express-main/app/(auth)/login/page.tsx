'use client'

import { loginAction } from "@/actions/login.actions"
import { useActionState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

const initialState = {
  error: '',
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  
  return (
    <div className="min-h-screen flex w-full font-sans">
      
      {/* 🎨 SIDE BRANDING (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center p-12">
         {/* Abstract shapes - Changés en Doré #db9b16 */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue rounded-full mix-blend-lighten filter blur-[120px] opacity-10 animate-blob"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-600 rounded-full mix-blend-lighten filter blur-[120px] opacity-10 animate-blob animation-delay-2000"></div>
         
         <div className="relative z-10 text-white max-w-lg">
            <h2 className="text-5xl font-black mb-6 tracking-tight leading-tight">
              Le futur s'écrit <br />
              <span className="text-[#db9b16]">maintenant.</span>
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed font-medium">
              Rejoignez les centaines d'étudiants qui ont déjà transformé leur vie grâce à notre accompagnement expert vers la Chine.
            </p>
            
            <div className="mt-12 flex gap-4">
               <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-black text-[#db9b16]">100%</div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Digitalisé</div>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-black text-[#db9b16]">24/7</div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Support</div>
               </div>
            </div>
         </div>
      </div>

      {/* 📝 FORM SECTION */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md space-y-8">
           <div className="text-center lg:text-left">
              {/* Remplacement de AGENCE par TRAVEL EXPRESS */}
              <Link href="/" className="inline-block mb-8 text-2xl font-black text-slate-900 tracking-tighter hover:opacity-80 transition-opacity">
                Travel <span className="text-[#db9b16]">Express</span>
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">Bon retour 👋</h1>
              <p className="text-slate-500 mt-2 font-medium">Connectez-vous pour suivre votre dossier.</p>
           </div>

          <form action={formAction} className="space-y-6">
            <Input 
              label="Email"
              name="email"
              type="email"
              placeholder="ex: jean@test.com"
              required
              className="bg-white focus:border-[#db9b16] focus:ring-[#db9b16]/10"
            />

            <Input 
              label="Mot de passe"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="bg-white focus:border-[#db9b16] focus:ring-[#db9b16]/10"
            />

            {/* Error Message */}
            {state?.error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2 font-medium">
                <span className="text-lg">⚠️</span> {state.error}
              </div>
            )}

            <Button 
              type="submit" 
              isLoading={isPending}
              variant="glow" 
              size="lg"
              className="w-full shadow-[#db9b16]/20 font-bold py-6 text-base"
            >
              Se connecter au portail
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-[#db9b16] hover:text-[#c48a14] font-bold transition-colors">
              Créer un compte
            </Link>
          </p>
          
           <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
              <p className="font-bold text-slate-700 mb-3 uppercase tracking-widest">Comptes de démo :</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="font-medium">student_manager@gmail.com</span>
                   <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200">student_manager</span>
                </div>
                                <div className="flex justify-between items-center">
                   <span className="font-medium">secretaire@gmail.com</span>
                   <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200">secretaire</span>
                </div>
                                <div className="flex justify-between items-center">
                   <span className="font-medium">qualite@agence.com</span>
                   <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200">staff123</span>
                </div>
                 <div className="flex justify-between items-center">
                   <span className="font-medium">admin@agence.com</span>
                   <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-[#db9b16]">admin123</span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}