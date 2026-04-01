import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, keywords, type, useAI } = body;

  const automation = await prisma.automation.create({
    data: {
      userId: user.id,
      name,
      isActive: true,
      triggers: {
        create: {
          type: "DM",
          keywords,
        }
      },
      actions: {
        create: {
          type,
          payload: { useAI }
        }
      }
    }
  });

  return NextResponse.json(automation);
}
