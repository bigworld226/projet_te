import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";
import { authService } from "@/services/auth.service";

// On définit les types pour Next.js 15
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  // 1. On attend la résolution des searchParams (Requis en Next.js 15)
  await searchParams;

  // 2. Vérification de la connexion via les cookies
  const cookieStore = await cookies();
  const session = await authService.getSession();
  const isConnected = !!cookieStore.get('user_id') || !!session?.userId;

  // Rediriger les admins connectés vers leur dashboard
  if (session?.role && session.role !== "STUDENT") {
    redirect("/admin/dashboard");
  }

  return <HomeClient isConnected={isConnected} isAdmin={!!session?.role && session.role !== "STUDENT"} />;
}
