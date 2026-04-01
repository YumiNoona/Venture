import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { isActive } = body;

  // Ensure automation belongs to the authenticated user
  const automation = await prisma.automation.findUnique({
    where: { id },
  });

  if (!automation || automation.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updatedAutomation = await prisma.automation.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(updatedAutomation);
}
