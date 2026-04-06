import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phrase, correct } = await req.json();
  if (!phrase) {
    return NextResponse.json({ error: "phrase required" }, { status: 400 });
  }

  const userId = session.user.id;
  const db = createServiceRoleClient();

  const { data: existing } = await db
    .from("vocab_progress")
    .select("id, times_seen, times_correct")
    .eq("user_id", userId)
    .eq("word", phrase)
    .single();

  if (existing) {
    await db
      .from("vocab_progress")
      .update({
        times_seen: existing.times_seen + 1,
        times_correct: existing.times_correct + (correct ? 1 : 0),
        status: correct ? "known" : "learning",
        last_seen: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await db.from("vocab_progress").insert({
      user_id: userId,
      word: phrase,
      status: correct ? "known" : "learning",
      times_seen: 1,
      times_correct: correct ? 1 : 0,
      last_seen: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}
