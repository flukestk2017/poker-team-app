import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import Sidebar from "@/components/trainer/layout/Sidebar";
import MobileNav from "@/components/trainer/layout/MobileNav";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const profile = userId
    ? (
        await createServiceRoleClient()
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()
      ).data
    : null;

  return (
    <div className="trainer-scope flex min-h-screen">
      <Sidebar profile={profile} />
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        <div className="max-w-4xl mx-auto p-4 lg:p-8">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
