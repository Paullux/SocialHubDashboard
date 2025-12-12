// components/LogoutButton.tsx
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

export function LogoutButton() {
  return (
    <LogoutLink postLogoutRedirectURL="/login">
      Se déconnecter
    </LogoutLink>
  );
}
