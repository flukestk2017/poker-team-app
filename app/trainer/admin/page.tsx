import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AdminInvite from "./AdminInvite";
import type { Profile } from "@/types/trainer";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/trainer/dashboard");
  }

  const db = createServiceRoleClient();
  const { data: allProfiles } = await db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted mt-1">Manage team members and view their progress</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Invite Member</h2>
        <AdminInvite />
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">
          All Members ({allProfiles?.length ?? 0})
        </h2>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-center px-5 py-3 font-medium">Streak</th>
                  <th className="text-center px-5 py-3 font-medium">Sessions</th>
                  <th className="text-center px-5 py-3 font-medium">Minutes</th>
                  <th className="text-left px-5 py-3 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {(allProfiles as Profile[])?.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`${
                      i !== (allProfiles.length - 1) ? "border-b border-border" : ""
                    } hover:bg-surface-2 transition-colors`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold flex-shrink-0">
                          {p.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          p.role === "admin"
                            ? "bg-accent/10 border-accent/30 text-accent"
                            : "bg-surface-2 border-border text-muted"
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-orange-400 font-semibold">🔥 {p.streak}</span>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-300">{p.total_sessions}</td>
                    <td className="px-5 py-3 text-center text-gray-300">{p.total_minutes}</td>
                    <td className="px-5 py-3 text-muted text-xs">
                      {p.last_practice_date
                        ? new Date(p.last_practice_date + "T12:00:00").toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
