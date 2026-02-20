import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "./ReactQueryProvider";
import Navbar from "@/components/Navbar";
import { UserInitializer } from "@/components/UserInitializer";
import AppToaster from "@/components/AppToaster";
import { prisma } from "@/lib/prisma"; // Assure-toi d'avoir cet import
import { authService } from "@/services/auth.service";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agence Études Chine | Votre Avenir Commence Ici 🚀",
  description: "La plateforme n°1 pour les étudiants souhaitant étudier en Chine.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await authService.getSession();

const userId = session?.userId;

  let userData = null;

if (userId) {
  userData = await prisma.user.findUnique({
    where: { id: userId.trim() },
    select: { 
      role: { select: { name: true } },
      fullName: true 
    }
   
  })
}
const isAdmin = userData?.role?.name !== 'STUDENT' && userData?.role?.name != null;

console.log('userdata',userData,"userid",userId)
  return (
    <html lang="fr">
      <head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#db9b16" />
</head>
      
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <UserInitializer />
      {!isAdmin && (
        <Navbar
          isConnected={!!userId}
          userRole={userData?.role?.name}
          userName={userData?.fullName || undefined}
        />
      )} 
        <ReactQueryProvider>
          <main className={isAdmin ? "" : "pt-20"}> {/* Ajout d'un padding pour compenser la Navbar fixed */}
            {children}
          </main>
          <AppToaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}


