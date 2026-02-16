"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { updatePaymentAction } from "@/actions/payment.action";
import { PaymentStatus } from "@prisma/client";
import axios from "axios";

export default function updatePaymentActionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  type University = { id: string; name: string; city: string };
  type User = { id: string; fullName: string; email: string };

  // 1. Définir le type de l'objet de formulaire
  interface PaymentForm {
    userId: string;
    universityId: string;
    amount: string;
    currency: string;
    method: string;
    status: PaymentStatus; // <--- Type strict ici
    reference: string;
  }

  // 2. Initialiser avec le type
  const [initial, setInitial] = useState<PaymentForm>({
    userId: "",
    universityId: "",
    amount: "",
    currency: "XOF",
    method: "CASH",
    status: PaymentStatus.PENDING,
    reference: ""
  });

  const [form, setForm] = useState<PaymentForm>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [students, setStudents] = useState<User[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showUserResults, setShowUserResults] = useState(false);

  // Charger les anciennes valeurs et options
  useEffect(() => {
    let ignore = false;
    async function fetchPayment() {
      try {
        const res = await fetch(`/api/admin/finances/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!ignore) {
          setInitial({
            userId: data.userId,
            universityId: data.universityId,
            amount: String(data.amount),
            currency: data.currency,
            method: data.method,
            status: data.status,
            reference: data.reference || ""
          });
          setForm({
            userId: data.userId,
            universityId: data.universityId,
            amount: String(data.amount),
            currency: data.currency,
            method: data.method,
            status: data.status,
            reference: data.reference || ""
          });
          setUserSearch("");
          setError("");
        }
      } catch {
        if (!ignore) setError("Erreur lors du chargement du paiement");
      }
    }
    async function fetchStudents() {
      try {
        const res = await axios.get("/api/admin/students");
        const data = res.data;
        if (!ignore) {
          console.log("[DEBUG] users:", data.users);
          setStudents(data.users || []);
        }
      } catch { }
    }
    async function fetchUniversities() {
      try {
        const res = await fetch("/api/universities");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!ignore) setUniversities(data.universities || []);
      } catch { }
    }
    if (id) fetchPayment();
    fetchStudents();
    fetchUniversities();
    return () => { ignore = true; };
  }, [id]);

  // Recherche utilisateur
  const filteredUsers = useMemo(() => {
    if (!userSearch) return [];
    return students.filter(u =>
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase())
    ).slice(0, 8);
  }, [students, userSearch]);

  const handleSelectUser = (user: User) => {
    setForm(f => ({ ...f, userId: user.id }));
    setUserSearch(user.fullName);
    setShowUserResults(false);
  };

  // ./app/admin/finances/[id]/update/page.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. On récupère l'ID depuis params
    // useParams peut renvoyer un tableau ou undefined, on force en string
    const applicationId = Array.isArray(id) ? id[0] : id;

    // 2. Vérification de sécurité pour TypeScript
    if (!applicationId) {
      setError("ID de la candidature manquant.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ✅ On passe l'ID sécurisé
      await updatePaymentAction(applicationId, form.status as PaymentStatus);

      setSuccess("✅ Paiement mis à jour !");
      setTimeout(() => router.push("/admin/finances"), 1200);
    } catch (err) {
      setError("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  // Affichage du nom de l'utilisateur sélectionné (ancienne valeur)
  const selectedUserName = () => {
    // Si on n'est pas en train de rechercher, afficher le nom de l'utilisateur sélectionné
    if (!userSearch && form.userId) {
      const user = students.find(u => u.id === form.userId);
      return user ? user.fullName : "";
    }
    // Sinon, afficher la recherche en cours
    return userSearch;
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fffbe6] to-[#f5f7fa] p-4 relative">
      <div className="fixed left-6 top-6 z-20">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shadow border border-slate-200"
          onClick={() => router.back()}
        >
          <span aria-hidden="true" className="text-xl">←</span> <span>Retour</span>
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 w-full max-w-lg flex flex-col gap-8 animate-fadein"
        style={{ boxShadow: '0 8px 32px 0 rgba(219,155,22,0.10)' }}
      >
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2 text-center tracking-tight">Modifier le paiement</h1>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-base border border-red-100 text-center animate-pulse">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-base border border-green-100 text-center animate-fadein">{success}</div>}
        {/* Étudiant */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700">Étudiant *</label>
          <select
            className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#db9b16] outline-none"
            value={form.userId}
            onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
            required
          >
            <option value="">Sélectionner un étudiant</option>
            {students.map(u => (
              <option key={u.id} value={u.id}>
                {u.fullName || u.email} {u.email && `(${u.email})`}
              </option>
            ))}
          </select>
        </div>
        {/* Université */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700">Université *</label>
          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2">
            {universities.map(u => (
              <label key={u.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${form.universityId === u.id ? 'bg-[#db9b16]/10 border border-[#db9b16]/20' : 'hover:bg-white'}`}>
                <input
                  type="radio"
                  className="accent-[#db9b16]"
                  checked={form.universityId === u.id}
                  onChange={() => setForm(f => ({ ...f, universityId: u.id }))}
                />
                <span className="text-sm text-slate-700">{u.name} <span className="text-[10px] text-slate-400 uppercase">({u.city})</span></span>
              </label>
            ))}
            {!form.universityId && (
              <div className="p-2 text-xs text-red-500 font-medium italic">Sélectionnez une université dans la liste pour valider.</div>
            )}
          </div>
        </div>
        {/* Montant et Devise */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700">Montant *</label>
            <input
              type="number"
              className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#db9b16] outline-none"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              min="0"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700">Devise</label>
            <select
              className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#db9b16] outline-none"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              required
            >
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        {/* Méthode et Référence */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700">Méthode</label>
            <select
              className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#db9b16] outline-none"
              value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
              required
            >
              <option value="CASH">Cash</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="MOOV_MONEY">Moov Money</option>
              <option value="TRANSFER">Virement</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700">Référence</label>
            <input
              type="text"
              className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#db9b16] outline-none"
              placeholder="N° de reçu, transaction..."
              value={form.reference}
              onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
            />
          </div>
        </div>
        {/* Statut */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-700">Statut</label>
          <select
            className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#db9b16] outline-none"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as PaymentStatus }))}
            required
          >
            <option value="PENDING">En attente</option>
            <option value="COMPLETED">Payé</option>
            <option value="FAILED">Échoué</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-[#db9b16] text-white font-bold py-3 px-4 rounded-2xl hover:bg-[#b8860b] transition shadow-lg shadow-[#db9b16]/20 disabled:opacity-50 mt-2 text-xl"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2"><span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> Mise à jour...</span>
          ) : "Enregistrer"}
        </button>
        <button
          type="button"
          className="text-slate-500 hover:underline mt-2 text-base"
          onClick={() => router.push("/admin/finances")}
        >Annuler</button>
      </form>
      {/* Debug: Affichage du tableau users (à retirer après debug) */}
      <pre className="text-xs bg-slate-100 p-2 rounded border border-slate-200 max-h-40 overflow-y-auto">{JSON.stringify(students, null, 2)}</pre>
    </main>
  );
}
