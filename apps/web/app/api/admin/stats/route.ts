import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { replyQueue, postQueue, ingestQueue } from "@ventry/queue";
import { requireUser } from "@/lib/getUser";

export async function GET() {
  try {
    // 1. Ensure user is authenticated (and ideally an admin, but we'll check base auth first)
    await requireUser();

    // 2. Fetch Queue Counts (BullMQ O(1))
    const [replyCounts, postCounts, ingestCounts] = await Promise.all([
      replyQueue.getJobCounts(),
      postQueue.getJobCounts(),
      ingestQueue.getJobCounts(),
    ]);

    // 3. Fetch Recent Failures (Indexed O(log N))
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failureCount = await prisma.workerLog.count({
      where: {
        status: "FAILED",
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    // 4. Critical Alerts (Token Invalidations)
    const invalidAccounts = await prisma.account.findMany({
      where: { tokenValid: false },
      select: { name: true, platform: true }
    });

    const alerts = invalidAccounts.map((acc: { platform: string, name: string | null }) => `Token Revoked: ${acc.platform} (${acc.name || "Unknown"})`);

    return NextResponse.json({
      queue: {
        waiting: (replyCounts.waiting || 0) + (postCounts.waiting || 0) + (ingestCounts.waiting || 0),
        active: (replyCounts.active || 0) + (postCounts.active || 0) + (ingestCounts.active || 0),
        failed: (replyCounts.failed || 0) + (postCounts.failed || 0) + (ingestCounts.failed || 0),
      },
      failuresLast24h: failureCount,
      alerts: alerts
    });
  } catch (error) {
    console.error("[StatsAPI] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
