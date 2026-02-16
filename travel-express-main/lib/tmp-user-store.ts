/**
 * Stockage temporaire partagé pour l'utilisateur
 * Utilisé entre temp-user et login-discussions
 * Il y a un seul endroit où on stocke le user
 */

interface TempUser {
    id: string;
    email: string;
    fullName: string;
    profileImage?: string;
    role?: {
        name: string;
    };
}

let sharedTempUserData: TempUser | null = null;

export function setTempUser(user: any): void {
    if (typeof user === 'string') {
        sharedTempUserData = JSON.parse(user);
    } else {
        sharedTempUserData = user;
    }
    console.log("💾 TempUser stocké: ", sharedTempUserData?.email);
}

export function getTempUser(): TempUser | null {
    console.log("🔍 TempUser trouvé: ", sharedTempUserData?.email || "NULL");
    return sharedTempUserData;
}

export function clearTempUser(): void {
    console.log("🗑️  TempUser supprimé");
    sharedTempUserData = null;
}
