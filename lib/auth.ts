// lib/auth.ts
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function requireUser() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("UNAUTHORIZED");
  return user; // { id, email, ... }
}
