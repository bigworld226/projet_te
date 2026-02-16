import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from "jose";

// On récupère la clé pour décoder le badge (le cookie)
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "ma_cle_secrete_super_longue_pour_le_dev"
);

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const sessionCookie = request.cookies.get('session')?.value;

    // 1. Pages de connexion (Auth)
    const isAuthPage = path === '/login' || path === '/register';
    // 2. Pages protégées
    const isProtectedPage = path.startsWith('/admin') || path.startsWith('/student');

    // --- LOGIQUE DE PROTECTION ---

    if (isProtectedPage) {
        // PAS DE COOKIE -> Direction Login
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            // VERIFICATION DU BADGE
            const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
            const role = payload.role as string;

            // PROTECTION DES RÔLES : Un étudiant ne va pas en Admin
            if (path.startsWith('/admin') && role === 'STUDENT') {
                return NextResponse.redirect(new URL('/student/dashboard', request.url));
            }
        } catch (error) {
            // BADGE INVALIDE (modifié, expiré, etc.) -> Direction Login
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 3. S'il est deja connecte' -> On empeche de retourner sur /login
    if (isAuthPage && sessionCookie) {
        try {
            await jwtVerify(sessionCookie, SECRET_KEY);
            return NextResponse.redirect(new URL('/student/', request.url));
        } catch (e) {
            console.error("Session cookie invalid during auth page access:", e);
            // Si le token est mort, on laisse l'utilisateur sur /login
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/student/:path*',
        '/admin/:path*',
        '/login',
        '/register',
    ],
};

export default proxy;