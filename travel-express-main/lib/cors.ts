/**
 * CORS Headers pour Travel Express Discussions
 * Autorise les requêtes depuis localhost:3000 (Next.js) et localhost:5173 (Vite)
 */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
};

export async function handleCorsOptions() {
    return new Response(null, { 
        status: 200,
        headers: corsHeaders 
    });
}
