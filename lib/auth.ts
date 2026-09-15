// lib/auth.ts
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function requireUser() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("UNAUTHORIZED");
  return user; // { id, email, ... }
}

/** Session Kinde valide ET permission `read:dashboard` accordée. À utiliser
 *  sur toute route qui touche à des données/actions utilisateur — seules les
 *  pages publiques listées dans `proxy.ts` (PUBLIC_PATHS) + `/login` +
 *  quelques endpoints machine-à-machine (cron, webhook Meta) y échappent. */
export async function requireDashboardUser() {
  const user = await requireUser();
  const { getPermission } = getKindeServerSession();
  const access = await getPermission("read:dashboard");
  if (!access?.isGranted) throw new Error("FORBIDDEN");
  return user;
}
