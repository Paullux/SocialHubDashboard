// app/login/page.tsx
import {
  LoginLink,
  RegisterLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const { getPermission } = getKindeServerSession();
  const access = await getPermission("read:dashboard");
  if (access?.isGranted) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl p-8 bg-white/5 border border-white/10 backdrop-blur">
        <h1 className="text-xl font-semibold mb-6">Connexion</h1>
        <div className="flex flex-col gap-3">
          <LoginLink className="rounded-md border border-blue-800 bg-blue-500 px-4 py-2 text-sm font-medium text-blue-50 hover:bg-blue-400 text-center">
            Se connecter
          </LoginLink>

          <RegisterLink className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 text-center">
            S’inscrire
          </RegisterLink>

          <LogoutLink className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 text-center">
            Se déconnecter
          </LogoutLink>
        </div>
      </div>
    </main>
  );
}
