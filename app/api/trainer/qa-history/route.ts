import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handScenario, userAnswer, aiFeedback } = await req.json();
  const db = createServiceRoleClient();

  await db.from("qa_history").insert({
    user_id: session.user.id,
    hand_scenario: handScenario,
    user_answer: userAnswer,
    ai_feedback: aiFeedback,
  });

  return NextResponse.json({ success: true });
}
