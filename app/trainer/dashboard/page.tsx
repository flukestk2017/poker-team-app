import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import Link from "next/link";
import StreakBadge from "@/components/trainer/ui/StreakBadge";
import ProgressRing from "@/components/trainer/ui/ProgressRing";
import PhraseOfTheDay from "@/components/trainer/ui/PhraseOfTheDay";

const MODULES = [
  { key: "vocab", href: "/trainer/vocab", icon: "📚", label: "Vocabulary", duration: "7 min", desc: "Coaching phrases — flip & learn" },
  { key: "coach", href: "/trainer/coach", icon: "🎓", label: "Coach Q&A", duration: "10 min", desc: "Hand review chat with Coach Alex" },
  { key: "listen", href: "/trainer/listen", icon: "🎧", label: "Listening Drill", duration: "8 min", desc: "Hear & type poker commentary" },
  { key: "video", href: "/trainer/video", icon: "🎬", label: "Video Analysis", duration: "5 min", desc: "Analyze transcript & quiz" },
];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const db = createServiceRoleClient();

  const [{ data: profile }, { data: todaySession }] = await Promise.all([
    userId
      ? db.from("profiles").select("*").eq("id", userId).single()
      : Promise.resolve({ data: null }),
    userId
      ? db
          .from("session_logs")
          .select("modules_completed")
          .eq("user_id", userId)
          .eq("date", new Date().toISOString().split("T")[0])
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const completed: string[] = todaySession?.modules_completed ?? [];
  const percent = (completed.length / 4) * 100;
  const allDone = completed.length === 4;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Good {getGreeting()},{" "}
            <span className="text-accent">{profile?.name?.split(" ")[0] ?? session?.user?.displayName ?? "Player"}</span>
          </h1>
          <p className="text-muted mt-1">
            {allDone ? "All done today! Great work." : "Keep up your daily practice."}
          </p>
        </div>
        <StreakBadge streak={profile?.streak ?? 0} size="lg" />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-8 flex-wrap">
        <ProgressRing percent={percent} size={140} label="Today" />
        <div className="flex-1 space-y-3 min-w-[160px]">
          <h3 className="font-semibold text-lg">Today&apos;s Progress</h3>
          {MODULES.map((m) => (
            <div key={m.key} className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  completed.includes(m.key)
                    ? "bg-accent text-white"
                    : "bg-surface-2 border border-border text-transparent"
                }`}
              >
                ✓
              </span>
              <span
                className={`text-sm ${
                  completed.includes(m.key) ? "text-gray-300 line-through decoration-muted" : "text-gray-400"
                }`}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
        {allDone && (
          <div className="w-full mt-2">
            <div className="bg-accent/10 border border-accent/30 rounded-xl px-5 py-3 text-center">
              <p className="text-accent font-semibold">🎉 Today complete! Keep your streak going!</p>
            </div>
          </div>
        )}
      </div>

      <PhraseOfTheDay />

      <div>
        <h2 className="font-semibold text-lg mb-4">Training Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map((m) => {
            const done = completed.includes(m.key);
            return (
              <Link
                key={m.key}
                href={m.href}
                className={`group relative bg-surface border rounded-2xl p-5 transition-all hover:border-accent/40 hover:-translate-y-0.5 ${
                  done ? "border-accent/30 bg-accent/5" : "border-border"
                }`}
              >
                {done && (
                  <span className="absolute top-4 right-4 text-accent text-sm font-semibold">✓</span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{m.label}</h3>
                    <p className="text-xs text-muted">{m.duration}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {m.desc}
                </p>
                <div className="mt-3 text-xs text-accent font-medium">
                  {done ? "Review again →" : "Start →"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Sessions", value: profile?.total_sessions ?? 0 },
          { label: "Minutes", value: profile?.total_minutes ?? 0 },
          { label: "Streak", value: `${profile?.streak ?? 0}d` },
          { label: "Today", value: `${completed.length}/4` },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
