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
  BookOpen, Shield, Building2, IdCard, CalendarDays, CalendarClock,
} from "lucide-react";

// Simplified role nav — 4 effective roles:
//   1 = Super Admin (full system)
//   6 = School Admin (manages everything, same as Super Admin)
//   7 = Teacher (own classes/grades)
//   8 = Student (own grades only)
// Legacy roles (2,3,4,5,9) are mapped to Super Admin via fallback below.

type NavItem = { label: string; href: string; icon: any };
type NavGroup = { label: string; items: NavItem[] };

const SUPER_ADMIN_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Learners", href: "/school/learners", icon: GraduationCap },
      { label: "Sections", href: "/school/sections", icon: CalendarDays },
      { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
      { label: "Schedule", href: "/admin/schedule", icon: CalendarClock },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Personnel", href: "/admin/personnel", icon: Users },
      { label: "Users", href: "/admin/users", icon: Shield },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Departments", href: "/school/departments", icon: Building2 },
      { label: "Schools", href: "/admin/schools", icon: School },
      { label: "ID System", href: "/admin/id", icon: IdCard },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const TEACHER_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/teacher", icon: LayoutDashboard }],
  },
  {
    label: "Teaching",
    items: [
      { label: "My Classes", href: "/teacher/classes", icon: BookOpen },
      { label: "Grades", href: "/teacher/grades", icon: ClipboardCheck },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports", href: "/teacher/reports", icon: BarChart3 }],
  },
];

const STUDENT_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/student", icon: LayoutDashboard }],
  },
  {
    label: "Academics",
    items: [{ label: "My Grades", href: "/student/grades", icon: BookOpen }],
  },
];

const NAV_GROUPS: Record<number, NavGroup[]> = {
  1: SUPER_ADMIN_GROUPS,
  6: SUPER_ADMIN_GROUPS, // School Admin manages all — identical to Super Admin
  7: TEACHER_GROUPS,
  8: STUDENT_GROUPS,
};

// Legacy roles auto-mapped to Super Admin groups
NAV_GROUPS[2] = SUPER_ADMIN_GROUPS;
NAV_GROUPS[3] = SUPER_ADMIN_GROUPS;
NAV_GROUPS[4] = SUPER_ADMIN_GROUPS;
NAV_GROUPS[5] = SUPER_ADMIN_GROUPS;
NAV_GROUPS[9] = SUPER_ADMIN_GROUPS;

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
  const groups = NAV_GROUPS[user.role] || STUDENT_GROUPS;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  function isItemActive(href: string): boolean {
    // Exact match for /admin, /teacher, /student dashboards
    if (href === "/admin" || href === "/teacher" || href === "/student") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

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
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isItemActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
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
