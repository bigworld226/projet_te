import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

// Clé secrète pour signer les jetons 
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "ma_cle_secrete_super_longue_pour_le_dev"
);

export const authService = {
  /**
   * Crée un jeton signé et le stocke dans un cookie HttpOnly
   */
  async createSession(userId: string, role: string, sessionVersion?: number) {
    const token = await new SignJWT({ userId, role, sessionVersion })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET_KEY);

    const cookieStore = await cookies();
    
    // On stocke TOUT dans un seul cookie chiffré et protégé
    cookieStore.set('session', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semaine
      path: '/',
      sameSite: 'lax'
    });
  },

  /**
   * Récupère et vérifie la session (depuis cookies ou Bearer token)
   */
  async getSession(request?: Request) {
    let token = null;

    // 1️⃣ Essayer le cookie d'abord (requêtes Next.js)
    const cookieStore = await cookies();
    token = cookieStore.get('session')?.value;

    // 2️⃣ Si pas de cookie, essayer le Bearer token du header (requêtes cross-origin)
    if (!token && request) {
      const headersList = await headers();
      const authHeader = headersList.get('Authorization') || headersList.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7); // Retirer "Bearer "
      }
    } else if (!token) {
      // Essayer via les headers() de Next.js en API route
      try {
        const headersList = await headers();
        const authHeader = headersList.get('Authorization') || headersList.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      } catch {
        // Headers non dispo dans ce contexte
      }
    }

    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      return payload as { userId: string, role: string, sessionVersion?: number };
    } catch (error) {
      // Si le jeton est invalide ou expiré
      return null;
    }
  },

  /**
   * Protection de route : retourne l'ID ou redirige
   * Vérifie aussi la validité de la session via sessionVersion
   */
  async requireUser() {
    const session = await this.getSession();
    if (!session) {
      redirect('/login');
    }

    // Vérification de la validité de la session via sessionVersion
    if (session.sessionVersion !== undefined) {
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { isActive: true, sessionVersion: true }, // Assure sessionVersion exists in your schema
      });

      // Si la version ne correspond pas ou l'utilisateur est inactif, forcer la déconnexion
      if (!user || !user.isActive || session.sessionVersion !== user.sessionVersion) {
        // En server component, on ne peut pas supprimer les cookies via this.logout().
        // On redirige simplement vers le login.
        // Optionnellement, on pourrait rediriger vers une route API de logout pour nettoyer.
        redirect('/login');
      }
    }

    return session.userId;
  },

  /**
   * Vérifie si l'utilisateur est admin
   */
  async requireAdmin() {
    const session = await this.getSession();
    if (!session || session.role === 'STUDENT') {
      redirect('/student/dashboard');
    }
    return session.userId;
  },

  /**
   * Récupère l'ID de l'utilisateur sans redirection (pour les API routes)
   */
  async getUserId(): Promise<string | null> {
    const session = await this.getSession();
    return session?.userId || null;
  },

  /**
   * Déconnexion
   */
  async logout() {
    const cookieStore = await cookies();
    cookieStore.delete('user_id');

    cookieStore.delete('session');
  }
}