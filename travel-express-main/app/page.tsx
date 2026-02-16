import { cookies } from "next/headers";
import HomeClient from "./HomeClient";

// On définit les types pour Next.js 15
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  // 1. On attend la résolution des searchParams (Requis en Next.js 15)
  await searchParams;

  // 2. Vérification de la connexion via les cookies
  const cookieStore = await cookies();
  const isConnected = !!cookieStore.get('user_id');

  return <HomeClient  isConnected={isConnected}/>;
}