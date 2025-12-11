// lib/pkce.ts
import { randomBytes, createHash } from "crypto";

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function generatePkce() {
  // 43–128 chars. Ici 48 bytes => 64+ chars après base64url
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge, method: "S256" as const };
}
