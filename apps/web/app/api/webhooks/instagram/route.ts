import { NextRequest, NextResponse } from "next/server";
import { addIngestJob } from "@ventry/queue";

const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log(`[Instagram Webhook] Received event:`, JSON.stringify(body));

    if (body.object !== "instagram") {
      return NextResponse.json({ message: "Event ignored" }, { status: 400 });
    }

    // Usually Instagram sends batches of entries
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        // We defer all heavy processing to BullMQ
        // jobId ensures we process this idempotency
        await addIngestJob(entry.id, {
          platform: "instagram",
          payload: entry
        });
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error) {
    console.error("Failed to parse Instagram webhook", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
