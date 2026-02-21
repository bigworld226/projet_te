import * as jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || "your-super-secret-key-change-in-prod";

export interface JWTPayload {
    id: string;
    email: string;
    fullName: string;
    profileImage?: string;
    role: {
        name: string;
    };
    permissions?: string[];
    iat?: number;
    exp?: number;
}

/**
 * Signer un token JWT pour un utilisateur
 * @param user - Données utilisateur
 * @param expiresIn - Expiration du token (default: 24h)
 */
export function signToken(user: any, expiresIn = '24h'): string {
    console.log("🔐 signToken called with user:", {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name
    });

    const payload: JWTPayload = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        role: {
            name: user.role?.name || 'STUDENT'
        }
    };

    console.log("🔐 JWT Payload to sign:", payload);

    // Ajouter les permissions selon le rôle
    payload.permissions = getPermissionsForRole(user.role?.name);

    const token = jwt.sign(payload, JWT_SECRET as string, { 
        expiresIn,
        algorithm: 'HS256'
    } as jwt.SignOptions);
    
    console.log("✅ Token signed successfully, token preview:", token.substring(0, 50) + "...");
    return token;
}

/**
 * Vérifier et décoder un token JWT
 * @param token - Le token à vérifier
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        console.log("🔍 verifyToken called with token length:", token.length);
        // Retirer le "Bearer " du début si présent
        const cleanToken = token.replace('Bearer ', '');
        console.log("🔍 cleanToken length:", cleanToken.length);
        console.log("🔍 JWT_SECRET length:", JWT_SECRET.length);
        const decoded = jwt.verify(cleanToken, JWT_SECRET, { 
            algorithms: ['HS256']
        }) as JWTPayload;
        console.log("✅ Token verified successfully, userId:", decoded.id);
        return decoded;
    } catch (err: any) {
        console.error('❌ Erreur vérification token:', err.name, err.message);
        console.error('❌ Error code:', err.code);
        return null;
    }
}

/**
 * Extraire les permissions selon le rôle
 * Facile à étendre quand on ajoute de nouveaux rôles
 */
function getPermissionsForRole(roleName?: string): string[] {
    const basePermissions: Record<string, string[]> = {
        'SUPERADMIN': [
            'CONVERSATION.READ',
            'CONVERSATION.CREATE',
            'CONVERSATION.DELETE',
            'MESSAGE.READ',
            'MESSAGE.SEND',
            'MESSAGE.EDIT',
            'MESSAGE.DELETE',
            'GROUP.CREATE',
            'GROUP.EDIT',
            'GROUP.DELETE',
            'USER.MANAGE',
        ],
        'SECRETARY': [
            'USER.MANAGE',
        ],
        'QUALITY_OFFICER': [
            'MESSAGE.READ',
        ],
        'STUDENT_MANAGER': [
            'CONVERSATION.READ',
            'CONVERSATION.CREATE',
            'MESSAGE.READ',
            'MESSAGE.SEND',
            'MESSAGE.EDIT',
            'MESSAGE.DELETE',
            'GROUP.CREATE',
            'GROUP.EDIT',
            'GROUP.DELETE',
        ],
        'STUDENT': [
            'CONVERSATION.READ',
            'MESSAGE.READ',
            'MESSAGE.SEND',
            'GROUP.READ', // Peut voir les groupes mais pas créer
        ],
    };

    return basePermissions[roleName || 'STUDENT'] || basePermissions['STUDENT'];
}

/**
 * Vérifier si un utilisateur a une permission spécifique
 */
export function hasPermission(payload: JWTPayload, permission: string): boolean {
    return payload.permissions?.includes(permission) || false;
}
