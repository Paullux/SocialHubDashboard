// middleware.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest } from "next/server";

type KindeToken = {
  permissions?: string[];
};

export default withAuth(
  async function middleware(req: NextRequest) {
    // Petit log propre (évite d’imprimer tout l’objet)
    console.log("----- New request 🔥 -----", req.method, req.nextUrl.pathname);
  },
  {
    loginPage: "/login",
    publicPaths: ["/", "/login"],
    isAuthorized: ({ token }: { token: KindeToken | null }) => {
      const perms = token?.permissions ?? [];
      return perms.includes("read:dashboard");
    },
  }
);

// N'applique le middleware que sur le dashboard
export const config = {
  matcher: ["/dashboard/:path*"],
};
