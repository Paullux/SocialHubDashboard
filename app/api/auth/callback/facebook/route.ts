// app/api/auth/callback/facebook/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  return NextResponse.json({
    provider: "facebook",
    code,
    error,
    note: "Replace this with a call to Facebook's OAuth token endpoint.",
  });
}
