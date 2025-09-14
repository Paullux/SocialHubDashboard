// app/api/auth/[kindeAuth]/route.ts
import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

/**
 * Kinde App Router handler
 * Gère /api/auth/login, /api/auth/callback, /api/auth/logout, etc.
 */
export const GET = handleAuth();
export const POST = handleAuth();

