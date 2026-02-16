'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { updateProfileAction } from '@/actions/user.actions';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ProfileSettings({ user }: { user: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await updateProfileAction(formData);
        if (res?.success) {
          setFeedback({ type: 'success', msg: 'Profil mis a jour.' });
          toast.success('Modifications enregistrees');
          router.refresh();
        } else {
          setFeedback({ type: 'error', msg: res?.error || 'Une erreur est survenue.' });
        }
      } catch {
        setFeedback({ type: 'error', msg: 'Erreur de connexion.' });
      }
    });
  }

  return (
    <form action={handleSubmit} className="min-h-[680px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2 border-b border-slate-100 pb-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Mon Profil</h2>
        <p className="text-sm text-slate-500">Modifiez vos informations de compte.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Field
          label="Nom complet"
          name="fullName"
          defaultValue={user?.fullName || ''}
          placeholder="Ex: Super Admin"
          icon={User}
          required
        />

        <Field
          label="Telephone"
          name="phone"
          type="tel"
          defaultValue={user?.phone || ''}
          placeholder="Ex: +226 XX XX XX XX"
          icon={Phone}
        />

        <Field
          label="Adresse email"
          name="email"
          type="email"
          defaultValue={user?.email || ''}
          placeholder="admin@exemple.com"
          icon={Mail}
          required
          className="md:col-span-2"
        />
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 mt-auto">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            'h-12 px-6 rounded-xl font-bold text-sm transition-all',
            isPending
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-[#db9b16] text-white'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2" size={16} />
              Sauvegarder
            </>
          )}
        </Button>

        {feedback && (
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            )}
          >
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {feedback.msg}
          </div>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  placeholder,
  icon: Icon,
  required,
  className,
}: any) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#db9b16]/30 focus:border-[#db9b16] text-slate-800"
        />
      </div>
    </div>
  );
}
