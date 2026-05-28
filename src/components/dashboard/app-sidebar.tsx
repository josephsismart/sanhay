"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, QrCode, BarChart3, Users, School, ClipboardCheck,
  Settings, LogOut, MessageSquareHeart, ScanLine, GraduationCap,
  BookOpen, Shield, Building2, IdCard, CalendarDays,
} from "lucide-react";

const NAV_ITEMS: Record<number, Array<{ label: string; href: string; icon: any }>> = {
  1: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Personnel", href: "/admin/personnel", icon: Users },
    { label: "Learners", href: "/admin/learners", icon: GraduationCap },
    { label: "Sections", href: "/admin/sections", icon: CalendarDays },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Schools", href: "/admin/schools", icon: School },
    { label: "ID System", href: "/admin/id", icon: IdCard },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  2: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Personnel", href: "/admin/personnel", icon: Users },
    { label: "Learners", href: "/admin/learners", icon: GraduationCap },
    { label: "Sections", href: "/admin/sections", icon: CalendarDays },
    { label: "ID System", href: "/admin/id", icon: IdCard },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  ],
  3: [
    { label: "Dashboard", href: "/department", icon: LayoutDashboard },
    { label: "Feedbacks", href: "/department/feedbacks", icon: MessageSquareHeart },
    { label: "Reports", href: "/department/reports", icon: BarChart3 },
  ],
  4: [
    { label: "Dashboard", href: "/school", icon: LayoutDashboard },
    { label: "Personnel", href: "/school/personnel", icon: Users },
    { label: "Learners", href: "/school/learners", icon: GraduationCap },
    { label: "Sections", href: "/school/sections", icon: CalendarDays },
    { label: "Departments", href: "/school/departments", icon: Building2 },
    { label: "ID System", href: "/admin/id", icon: IdCard },
    { label: "Reports", href: "/school/reports", icon: BarChart3 },
    { label: "Settings", href: "/school/settings", icon: Settings },
  ],
  6: [
    { label: "Dashboard", href: "/school", icon: LayoutDashboard },
    { label: "Personnel", href: "/school/personnel", icon: Users },
    { label: "Learners", href: "/school/learners", icon: GraduationCap },
    { label: "Sections", href: "/school/sections", icon: CalendarDays },
    { label: "Departments", href: "/school/departments", icon: Building2 },
    { label: "ID System", href: "/admin/id", icon: IdCard },
    { label: "Reports", href: "/school/reports", icon: BarChart3 },
  ],
  7: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "My Classes", href: "/teacher/classes", icon: BookOpen },
    { label: "Grades", href: "/teacher/grades", icon: ClipboardCheck },
    { label: "Reports", href: "/teacher/reports", icon: BarChart3 },
  ],
  8: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "My Grades", href: "/student/grades", icon: BookOpen },
  ],
  9: [
    { label: "Scanner", href: "/guard", icon: ScanLine },
    { label: "Scan Logs", href: "/guard/logs", icon: Shield },
  ],
};

NAV_ITEMS[5] = NAV_ITEMS[4];

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: number;
    roleLabel: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS[8];

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/anhs-logo.png" alt="ANHS" width={36} height={36} className="rounded-full" />
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">ANHS Portal</span>
            <span className="text-[10px] text-muted-foreground leading-tight">School Information System</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name || "User"}</p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full bg-indigo-50 text-indigo-600">
              {user.roleLabel}
            </Badge>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Link href="/api/auth/signout">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
