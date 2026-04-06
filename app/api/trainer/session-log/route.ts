import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { module, durationMinutes } = await req.json();
  if (!module) {
    return NextResponse.json({ error: "module required" }, { status: 400 });
  }

  const userId = session.user.id;
  const today = new Date().toISOString().split("T")[0];
  const db = createServiceRoleClient();

  const { data: existing } = await db
    .from("session_logs")
    .select("id, modules_completed")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (existing) {
    const updated = Array.from(new Set([...existing.modules_completed, module]));
    await db
      .from("session_logs")
      .update({ modules_completed: updated })
      .eq("id", existing.id);
  } else {
    await db.from("session_logs").insert({
      user_id: userId,
      date: today,
      modules_completed: [module],
      duration_minutes: durationMinutes ?? 5,
      notes: "",
    });
  }

  return NextResponse.json({ success: true });
}
