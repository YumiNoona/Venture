import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!appId || !baseUrl) {
    console.error("[OAuth Login] Missing environment variables: INSTAGRAM_APP_ID or NEXT_PUBLIC_BASE_URL");
    return NextResponse.json({ error: "OAuth configuration missing" }, { status: 500 });
  }

  const redirectUri = `${baseUrl}/api/auth/meta/callback`;

  // These are the correct scopes for Instagram API with Instagram Login
  // Do NOT use instagram_manage_messages — that is for the old Facebook Login flow
  const scopes = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
  ].join(",");

  // Use the Instagram-specific OAuth endpoint, NOT the Facebook dialog
  const oauthUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;

  console.log(`[OAuth] Redirecting to Instagram: ${oauthUrl}`);

  return NextResponse.redirect(oauthUrl);
}