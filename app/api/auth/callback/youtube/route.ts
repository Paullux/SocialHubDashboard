// app/api/auth/callback/youtube/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  return NextResponse.json({
    provider: "youtube",
    code,
    error,
    note: "Replace this with a call to Google's OAuth token endpoint.",
  });
}
