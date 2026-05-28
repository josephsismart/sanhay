import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

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
