// app/api/meta/deauthorize/route.ts
// Callback de désautorisation Meta : appelé (POST, server-to-server) quand un
// utilisateur retire l'accès de l'app depuis ses paramètres Facebook/Instagram.
// Doc : https://developers.facebook.com/docs/facebook-login/guides/data-deletion
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

function b64urlToBuf(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/** Vérifie et décode un signed_request Meta. Renvoie le payload ou null. */
function parseSignedRequest(signed: string, appSecret: string): any | null {
  const [encodedSig, payload] = signed.split(".", 2);
  if (!encodedSig || !payload) return null;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest();
  const got = b64urlToBuf(encodedSig);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) {
    return null;
  }

  try {
    return JSON.parse(b64urlToBuf(payload).toString("utf8"));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const form = await req.formData().catch(() => null);
  const signed = form?.get("signed_request");
  if (typeof signed !== "string") {
    return NextResponse.json({ error: "missing signed_request" }, { status: 400 });
  }

  const data = parseSignedRequest(signed, appSecret);
  const fbUserId: string | undefined = data?.user_id;
  if (!fbUserId) {
    return NextResponse.json({ error: "invalid signed_request" }, { status: 400 });
  }

  // Supprime les comptes liés Instagram rattachés à cet utilisateur Facebook.
  const { count } = await prisma.accountLink.deleteMany({
    where: {
      provider: "instagram",
      meta: { path: ["fbUserId"], equals: fbUserId },
    },
  });

  const code = crypto.randomUUID();
  console.log("[META][deauthorize] fb_user=%s deleted=%d code=%s", fbUserId, count, code);

  // Meta attend un 200 ; on renvoie un statut de suppression consultable.
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  return NextResponse.json({
    url: `${base}/delete-data?code=${code}`,
    confirmation_code: code,
  });
}

// Un GET simple pour vérifier que la route répond (diagnostic).
export function GET() {
  return NextResponse.json({ ok: true, hint: "POST signed_request here" });
}
