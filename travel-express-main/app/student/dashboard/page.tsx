import { redirect } from "next/navigation";

export default function StudentDashboardAliasPage() {
  // Evite que "/student/dashboard" soit interprété comme un ID de dossier.
  redirect("/student/");
}

