"use client";
import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/Button";

export function DeleteStudentButton({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'étudiant ${studentName} ?`)) return;
    setLoading(true);
    setError("");
    try {
      await axios.delete(`/api/admin/students/${studentId}`);
      window.location.reload();
    } catch {
      setError("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0 rounded-lg text-red-500 hover:text-white hover:bg-red-500 border-red-500"
        onClick={handleDelete}
        disabled={loading}
        title="Supprimer l'étudiant"
      >
        {loading ? "..." : "✕"}
      </Button>
      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
    </>
  );
}
