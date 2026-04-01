import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase";
import { encryptToken } from "@ventry/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");

    if (error || !code) {
      console.error("[OAuth Callback] Instagram Auth Error:", error, errorReason);
      return NextResponse.redirect(`${siteUrl}/dashboard/settings/accounts?error=auth_denied`);
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;

    if (!siteUrl || !appId || !appSecret) {
      console.error("[OAuth Callback] Missing env: NEXT_PUBLIC_BASE_URL, INSTAGRAM_APP_ID, or INSTAGRAM_APP_SECRET");
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    const redirectUri = `${siteUrl}/api/auth/meta/callback`;

    // Step 1: Exchange the code for a SHORT-LIVED access token
    // Instagram Login uses a different token endpoint than Facebook Login
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: code,
    });

    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[OAuth Callback] Short-lived token exchange failed:", JSON.stringify(tokenData));
      return NextResponse.redirect(`${siteUrl}/dashboard/settings/accounts?error=token_exchange_failed`);
    }

    const shortLivedToken = tokenData.access_token;
    const instagramUserId = tokenData.user_id; // Instagram gives us the user ID directly

    console.log("[OAuth Callback] Short-lived token obtained for user:", instagramUserId);

    // Step 2: Exchange for a LONG-LIVED token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`
    );

    const longLivedData = await longLivedResponse.json();

    if (!longLivedResponse.ok || !longLivedData.access_token) {
      console.error("[OAuth Callback] Long-lived token exchange failed:", JSON.stringify(longLivedData));
      return NextResponse.redirect(`${siteUrl}/dashboard/settings/accounts?error=long_lived_token_failed`);
    }

    const longLivedToken = longLivedData.access_token;

    // Step 3: Get the user's Instagram profile info
    const profileResponse = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,name,username&access_token=${longLivedToken}`
    );

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error("[OAuth Callback] Profile fetch failed:", JSON.stringify(profileData));
      return NextResponse.redirect(`${siteUrl}/dashboard/settings/accounts?error=profile_fetch_failed`);
    }

    const igAccountId = profileData.id || instagramUserId.toString();
    const igName = profileData.username || profileData.name || "Instagram Account";

    console.log("[OAuth Callback] Instagram profile:", { igAccountId, igName });

    // Step 4: Get the authenticated user from Supabase session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[OAuth Callback] No authenticated Supabase user. Redirecting to login.");
      return NextResponse.redirect(`${siteUrl}/login?error=auth_required`);
    }

    // Step 5: Save/update the account in the database
    const encryptedToken = encryptToken(longLivedToken);

    await prisma.account.upsert({
      where: {
        platform_externalId: {
          platform: "instagram",
          externalId: igAccountId,
        },
      },
      update: {
        accessToken: encryptedToken,
        name: igName,
        tokenValid: true,
        lastChecked: null,
      },
      create: {
        userId: user.id,
        platform: "instagram",
        externalId: igAccountId,
        name: igName,
        accessToken: encryptedToken,
        tokenValid: true,
      },
    });

    console.log(`[OAuth Callback] Account saved: ${igName} (${igAccountId}) for user ${user.id}`);

    return NextResponse.redirect(
      `${siteUrl}/dashboard/settings/accounts?success=connected&account=${encodeURIComponent(igName)}`
    );
  } catch (err) {
    console.error("[OAuth Callback] Critical Error:", err);
    return NextResponse.redirect(`${siteUrl}/dashboard/settings/accounts?error=internal_server_error`);
  }
}