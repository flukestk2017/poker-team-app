import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import StreakBadge from "@/components/trainer/ui/StreakBadge";

export default async function ProgressPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const db = createServiceRoleClient();

  const [{ data: profile }, { data: sessions }, { data: vocab }, { data: qa }] =
    await Promise.all([
      userId
        ? db.from("profiles").select("*").eq("id", userId).single()
        : Promise.resolve({ data: null }),
      userId
        ? db
            .from("session_logs")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: null }),
      userId
        ? db.from("vocab_progress").select("status").eq("user_id", userId)
        : Promise.resolve({ data: null }),
      userId
        ? db.from("qa_history").select("id").eq("user_id", userId)
        : Promise.resolve({ data: null }),
    ]);

  const knownWords = vocab?.filter((v: { status: string }) => v.status === "known").length ?? 0;
  const totalWords = vocab?.length ?? 0;
  const totalQA = qa?.length ?? 0;

  const stats = [
    { label: "Day Streak", value: profile?.streak ?? 0, icon: "🔥" },
    { label: "Words Known", value: knownWords, icon: "📚" },
    { label: "Total Sessions", value: profile?.total_sessions ?? 0, icon: "📅" },
    { label: "Total Minutes", value: profile?.total_minutes ?? 0, icon: "⏱️" },
    { label: "Q&A Answered", value: totalQA, icon: "🎓" },
    { label: "Vocab Progress", value: `${totalWords} seen`, icon: "🧠" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-muted mt-1">Your learning journey so far</p>
        </div>
        <StreakBadge streak={profile?.streak ?? 0} size="lg" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-accent">{s.value}</p>
            <p className="text-sm text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">Recent Sessions</h2>
        {sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((s: { id: string; date: string; modules_completed: string[]; duration_minutes: number }) => (
              <div
                key={s.id}
                className="bg-surface border border-border rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-3"
              >
                <div>
                  <p className="font-medium text-sm">{formatDate(s.date)}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {(s.modules_completed as string[]).map((m) => (
                      <span
                        key={m}
                        className="text-xs px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-full capitalize"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {s.duration_minutes} min
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {(s.modules_completed as string[]).length}/4 modules
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted">
            No sessions yet. Complete your first module to start tracking progress!
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
