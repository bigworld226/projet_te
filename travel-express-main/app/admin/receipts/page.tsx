"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FilePlus2, FileUp, Trash2 } from "lucide-react";

type Student = {
  id: string;
  fullName: string | null;
  email: string;
};

type ReceiptTemplate = {
  id: string;
  name: string;
  description: string;
  kind: "default" | "custom";
  fileUrl?: string | null;
};

type ReceiptItem = {
  id: string;
  createdAt: string;
  receiptNumber: number | null;
  receiptType: string;
  templateName: string;
  templateFileUrl?: string | null;
  recipientName: string;
  recipientEmail: string;
  amount: number | null;
  unitAmount?: number | null;
  amountPaid?: number | null;
  remainingAmount?: number | null;
  description?: string;
  note: string;
};

export default function AdminReceiptsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [currentRole, setCurrentRole] = useState("");
  const [canDeleteGeneratedReceipts, setCanDeleteGeneratedReceipts] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"create" | "generated" | "templates">("create");

  const [userId, setUserId] = useState("");
  const [templateId, setTemplateId] = useState("default-simple");
  const [receiptType, setReceiptType] = useState("FACTURE");
  const [amount, setAmount] = useState("");
  const [unitAmount, setUnitAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("0");
  const [description, setDescription] = useState(
    "Frais de traitement des dossiers pour la procédure d'obtention de bourse d'étude en Chine (Admission + JW + visa)"
  );
  const [note, setNote] = useState("");

  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === userId) ?? null,
    [students, userId]
  );

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === templateId) ?? null,
    [templates, templateId]
  );

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/receipts", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement");
      setStudents(data.students || []);
      setTemplates(data.templates || []);
      setReceipts(data.receipts || []);
      setCurrentRole(data.currentRole || "");
      setCanDeleteGeneratedReceipts(Boolean(data.canDeleteGeneratedReceipts));
      if (!templateId && data.templates?.length) {
        setTemplateId(data.templates[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/receipts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          templateId,
          receiptType,
          amount: amount.trim() ? Number(amount) : null,
          unitAmount: unitAmount.trim() ? Number(unitAmount) : null,
          amountPaid: amountPaid.trim() ? Number(amountPaid) : null,
          remainingAmount: remainingAmount.trim() ? Number(remainingAmount) : 0,
          description,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Impossible de générer le reçu");

      setAmount("");
      setUnitAmount("");
      setAmountPaid("");
      setRemainingAmount("0");
      setNote("");
      setTab("generated");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Erreur serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFile) return;
    setIsUploadingTemplate(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", templateFile);
      form.append("name", newTemplateName);
      form.append("description", newTemplateDescription);

      const res = await fetch("/api/admin/receipts", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Impossible d'ajouter le modèle");

      setTemplateFile(null);
      setNewTemplateName("");
      setNewTemplateDescription("");
      setTab("templates");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Erreur serveur");
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!canDeleteGeneratedReceipts) return;
    if (!window.confirm("Supprimer ce reçu généré ?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/receipts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Suppression impossible");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Erreur serveur");
    }
  };

  if (isLoading) return <div className="p-10 text-slate-500">Chargement des reçus...</div>;

  return (
    <main className="p-4 md:p-10 space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Gestion des Reçus</h1>
        <p className="text-slate-500 mt-2">
          Deux modèles de base sont intégrés selon ton schéma, et tu peux ajouter des modèles Word/PDF.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("create")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === "create" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Créer un reçu
        </button>
        <button
          onClick={() => setTab("generated")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === "generated" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Reçus générés
        </button>
        <button
          onClick={() => setTab("templates")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === "templates" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Modèles
        </button>
      </div>

      {tab === "create" && (
        <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreate}>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Étudiant</span>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 bg-white text-slate-900" required>
                <option value="">Sélectionner un étudiant</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName || student.email} ({student.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Modèle de reçu</span>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 bg-white text-slate-900" required>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} {tpl.kind === "custom" ? "(Personnalisé)" : "(Natif)"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type (ex: FACTURE)</span>
              <input
                type="text"
                value={receiptType}
                onChange={(e) => setReceiptType(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="FACTURE"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Montant (optionnel)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Ex: 400000"
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Montant unitaire</span>
              <input
                type="number"
                value={unitAmount}
                onChange={(e) => setUnitAmount(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Ex: 400000"
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Montant versé</span>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Ex: 400000"
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Montant restant à verser</span>
              <input
                type="number"
                value={remainingAmount}
                onChange={(e) => setRemainingAmount(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Ex: 0"
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description de la prestation</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Description facture"
              />
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Note (optionnelle)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Commentaire sur le reçu."
              />
            </label>

            <div className="md:col-span-2 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-slate-500">
                {selectedStudent ? `Destinataire: ${selectedStudent.fullName || selectedStudent.email}` : "Sélectionne un étudiant."}
                {selectedTemplate ? ` - Modèle: ${selectedTemplate.name}` : ""}
              </p>
              <button
                type="submit"
                disabled={isSubmitting || !userId}
                className="h-11 px-5 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50 inline-flex items-center gap-2"
              >
                <FilePlus2 size={16} />
                {isSubmitting ? "Génération..." : "Générer le reçu"}
              </button>
            </div>
          </form>
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </section>
      )}

      {tab === "generated" && (
        <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Reçus générés</h2>
          <div className="space-y-3">
            {receipts.length === 0 ? (
              <p className="text-slate-500">Aucun reçu généré pour le moment.</p>
            ) : (
              receipts.map((receipt) => (
                <div key={receipt.id} className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      #{receipt.receiptNumber ?? "-"} - {receipt.receiptType}
                    </p>
                    <p className="text-sm text-slate-500 break-words">
                      {receipt.recipientName || receipt.recipientEmail} - {new Date(receipt.createdAt).toLocaleString("fr-FR")}
                    </p>
                    <p className="text-sm text-slate-700">Modèle: {receipt.templateName}</p>
                    {receipt.amount !== null && <p className="text-sm text-slate-700">Montant: {receipt.amount.toLocaleString("fr-FR")} XOF</p>}
                    {typeof receipt.amountPaid === "number" && (
                      <p className="text-sm text-slate-700">
                        Montant versé: {receipt.amountPaid.toLocaleString("fr-FR")} XOF
                      </p>
                    )}
                    {typeof receipt.remainingAmount === "number" && (
                      <p className="text-sm text-slate-700">
                        Reste à verser: {receipt.remainingAmount.toLocaleString("fr-FR")} XOF
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/api/student/receipts/${receipt.id}/download`} className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 inline-flex items-center gap-2 text-sm font-medium">
                      <Download size={15} />
                      Télécharger
                    </a>
                    {canDeleteGeneratedReceipts && (
                      <button
                        onClick={() => handleDeleteReceipt(receipt.id)}
                        className="h-10 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 inline-flex items-center gap-2 text-sm font-medium"
                        title="Supprimer ce reçu"
                      >
                        <Trash2 size={15} />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {!canDeleteGeneratedReceipts && (
            <p className="text-xs text-slate-500 mt-4">Suppression réservée au SuperAdmin.</p>
          )}
        </section>
      )}

      {tab === "templates" && (
        <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Modèles disponibles</h2>
            <p className="text-slate-500 text-sm">Les 2 modèles natifs sont déjà intégrés. Tu peux ajouter d'autres modèles Word/PDF.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="border border-slate-100 rounded-2xl p-4">
                <p className="font-semibold text-slate-900">{tpl.name}</p>
                <p className="text-sm text-slate-500">{tpl.description || "Sans description"}</p>
                <p className="text-xs mt-2 text-slate-600">{tpl.kind === "custom" ? "Personnalisé" : "Natif"}</p>
                {tpl.fileUrl && (
                  <a href={tpl.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline mt-2 inline-block">
                    Ouvrir le modèle
                  </a>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleUploadTemplate} className="border border-slate-100 rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-900">Ajouter un modèle personnalisé</h3>
            <input
              type="text"
              placeholder="Nom du modèle"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 bg-white text-slate-900 placeholder:text-slate-400"
            />
            <input
              type="text"
              placeholder="Description"
              value={newTemplateDescription}
              onChange={(e) => setNewTemplateDescription(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 bg-white text-slate-900 placeholder:text-slate-400"
            />
            <input
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
              className="w-full"
            />
            <button
              type="submit"
              disabled={!templateFile || isUploadingTemplate}
              className="h-10 px-4 rounded-lg bg-slate-900 text-white disabled:opacity-50 inline-flex items-center gap-2"
            >
              <FileUp size={15} />
              {isUploadingTemplate ? "Ajout..." : "Ajouter le modèle"}
            </button>
          </form>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {currentRole && <p className="text-xs text-slate-400">Rôle connecté: {currentRole}</p>}
    </main>
  );
}
