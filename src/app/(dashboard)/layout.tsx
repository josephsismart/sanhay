import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { getActiveSySchema } from "@/lib/sy-schema";
import { CalendarDays } from "lucide-react";

function quarterLabel(q: number): string {
  return q === 1 ? "1st" : q === 2 ? "2nd" : q === 3 ? "3rd" : q === 4 ? "4th" : "--";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch active school year + quarter from global.tbl_sy
  let sy: { description: string; inputGradesQrtr: number } = { description: "--", inputGradesQrtr: 0 };
  try {
    const info = await getActiveSySchema();
    sy = { description: info.description, inputGradesQrtr: info.inputGradesQrtr };
  } catch {
    /* silent fallback */
  }
  const qLabel = quarterLabel(sy.inputGradesQrtr);

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as any).role || 6,
          roleLabel: (session.user as any).roleLabel || "User",
        }}
      />
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="flex h-14 items-center gap-3 border-b bg-white px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />

          {/* Active SY + Quarter Badge */}
          <div className="hidden md:flex items-center gap-2 rounded-md border bg-gradient-to-r from-indigo-50 to-cyan-50 px-3 py-1.5 shadow-sm">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-900">
              S.Y. {sy.description || "--"}
            </span>
            <span className="text-indigo-300">&middot;</span>
            <span className="text-xs font-semibold text-cyan-700">
              {qLabel} Quarter
            </span>
          </div>

          {/* Compact version for mobile */}
          <div className="flex md:hidden items-center gap-1.5 rounded-md border bg-indigo-50 px-2 py-1">
            <CalendarDays className="h-3 w-3 text-indigo-600" />
            <span className="text-[10px] font-semibold text-indigo-900">
              {sy.description?.split("-")[0] || "--"} &middot; Q{sy.inputGradesQrtr || "?"}
            </span>
          </div>

          <div className="flex-1" />
          <p className="text-xs text-muted-foreground hidden sm:block">
            {session.user.name} &middot; {(session.user as any).roleLabel}
          </p>
        </header>
        <div className="flex-1 p-4 sm:p-6 bg-muted/30">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
