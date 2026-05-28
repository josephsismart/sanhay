import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  UserCheck,
  UserCog,
  ScanLine,
  Building2,
  BookOpen,
  Shield,
  MapPin,
  BarChart3,
} from "lucide-react";
import { PopulationPyramid } from "@/components/charts/population-pyramid";
import { LearnersByLocation } from "@/components/charts/learners-by-location";
import { EnrollmentByGrade } from "@/components/charts/enrollment-by-grade";
import { GenderPie } from "@/components/charts/gender-pie";
import { SectionTable } from "@/components/charts/section-table";

async function getDashboardData() {
  try {
    const [
      learnersResult,
      teachingResult,
      nonTeachingResult,
      usersResult,
      deptsResult,
      sectionsResult,
      roleDistribution,
    ] = await Promise.all([
      prisma.$queryRaw<[{count: bigint}]>`
        SELECT count(1) as count FROM sy1.bs_tbl_learner_enrollment WHERE status_id = 5
      `.catch(() => [{ count: BigInt(0) }]),
      prisma.$queryRaw<[{count: bigint}]>`
        SELECT count(1) as count FROM profile.tbl_schoolpersonnel WHERE employee_type_id = 4 AND is_active = 1
      `.catch(() => [{ count: BigInt(0) }]),
      prisma.$queryRaw<[{count: bigint}]>`
        SELECT count(1) as count FROM profile.tbl_schoolpersonnel WHERE employee_type_id = 5 AND is_active = 1
      `.catch(() => [{ count: BigInt(0) }]),
      prisma.$queryRaw<[{count: bigint}]>`
        SELECT count(1) as count FROM account.tbl_useraccount WHERE is_active = true
      `.catch(() => [{ count: BigInt(0) }]),
      prisma.$queryRaw<[{count: bigint}]>`
        SELECT count(1) as count FROM profile.tbl_school_department
      `.catch(() => [{ count: BigInt(0) }]),
      prisma.$queryRaw<[{count: bigint}]>`
        SELECT count(1) as count FROM building_sectioning.tbl_room_section WHERE is_active = true
      `.catch(() => [{ count: BigInt(0) }]),
      prisma.$queryRaw<Array<{role: string, count: bigint}>>`
        SELECT r.description as role, count(u.id) as count
        FROM account.tbl_useraccount u
        JOIN account.tbl_role r ON u.role_id = r.id
        WHERE u.is_active = true
        GROUP BY r.description, r.order_by
        ORDER BY r.order_by
      `.catch(() => []),
    ]);

    return {
      learners: Number(learnersResult[0]?.count || 0),
      teachingPersonnel: Number(teachingResult[0]?.count || 0),
      nonTeachingPersonnel: Number(nonTeachingResult[0]?.count || 0),
      totalUsers: Number(usersResult[0]?.count || 0),
      departments: Number(deptsResult[0]?.count || 0),
      sections: Number(sectionsResult[0]?.count || 0),
      roleDistribution: (roleDistribution as any[]).map((r: any) => ({
        role: r.role,
        count: Number(r.count),
      })),
    };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return {
      learners: 0,
      teachingPersonnel: 0,
      nonTeachingPersonnel: 0,
      totalUsers: 0,
      departments: 0,
      sections: 0,
      roleDistribution: [],
    };
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const totalPersonnel = data.teachingPersonnel + data.nonTeachingPersonnel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back! Here is an overview of your school system.
        </p>
      </div>

      {/* Main stats — mirrors legacy dashboard 4 cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Enrolled Learners",
            value: data.learners.toLocaleString(),
            icon: GraduationCap,
            color: "text-indigo-600 bg-indigo-50",
            desc: "SY1 active enrollees",
          },
          {
            label: "Teaching Personnel",
            value: data.teachingPersonnel.toLocaleString(),
            icon: UserCheck,
            color: "text-emerald-600 bg-emerald-50",
            desc: "Active teaching staff",
          },
          {
            label: "Non-Teaching",
            value: data.nonTeachingPersonnel.toLocaleString(),
            icon: UserCog,
            color: "text-blue-600 bg-blue-50",
            desc: "Active non-teaching staff",
          },
          {
            label: "User Accounts",
            value: data.totalUsers.toLocaleString(),
            icon: Users,
            color: "text-amber-600 bg-amber-50",
            desc: "Active portal users",
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-extrabold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-violet-600 bg-violet-50">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{data.departments}</div>
            <p className="text-xs text-muted-foreground mt-1">School departments</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sections</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-pink-600 bg-pink-50">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{data.sections}</div>
            <p className="text-xs text-muted-foreground mt-1">Active class sections</p>
          </CardContent>
        </Card>

        <Card className="bg-white col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Personnel</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-cyan-600 bg-cyan-50">
              <Shield className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{totalPersonnel}</div>
            <p className="text-xs text-muted-foreground mt-1">Teaching + non-teaching</p>
          </CardContent>
        </Card>
      </div>

      {/* Role distribution + Quick info */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">User Accounts by Role</CardTitle>
              <Badge variant="secondary" className="rounded-full text-xs bg-indigo-50 text-indigo-600">
                {data.totalUsers} total
              </Badge>
            </div>
            <CardDescription>Distribution of active user accounts across roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.roleDistribution.map((r) => {
                const pct = data.totalUsers > 0 ? Math.round((r.count / data.totalUsers) * 100) : 0;
                const colors: Record<string, string> = {
                  "SUPER ADMIN": "bg-red-500",
                  "ADMIN": "bg-indigo-500",
                  "DEPARTMENT HEAD": "bg-violet-500",
                  "SCHOOL HEAD": "bg-blue-500",
                  "SCHOOL PLANNING": "bg-cyan-500",
                  "SCHOOL ADMIN": "bg-emerald-500",
                  "TEACHER": "bg-amber-500",
                  "STUDENT": "bg-pink-500",
                  "SECURITY GUARD": "bg-gray-500",
                };
                return (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{r.role}</span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[r.role] || "bg-indigo-500"} rounded-full`}
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-8 text-right">{r.count}</span>
                  </div>
                );
              })}
              {data.roleDistribution.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No user data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">School Overview</CardTitle>
            <CardDescription>Quick summary of your school system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Enrolled Learners", value: data.learners, icon: GraduationCap, color: "text-indigo-600 bg-indigo-50" },
                { label: "Teaching Staff", value: data.teachingPersonnel, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
                { label: "Non-Teaching Staff", value: data.nonTeachingPersonnel, icon: UserCog, color: "text-blue-600 bg-blue-50" },
                { label: "Departments", value: data.departments, icon: Building2, color: "text-violet-600 bg-violet-50" },
                { label: "Class Sections", value: data.sections, icon: BookOpen, color: "text-pink-600 bg-pink-50" },
                { label: "Portal Users", value: data.totalUsers, icon: Users, color: "text-amber-600 bg-amber-50" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts — Learners by Location + Population Pyramid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Learners by Location</CardTitle>
                <CardDescription>Number of learners per city/municipality</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LearnersByLocation />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-pink-50 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Population for Learners</CardTitle>
                <CardDescription>Learners data based on sex and age</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PopulationPyramid />
          </CardContent>
        </Card>
      </div>

      {/* Enrollment by Grade + Gender Distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Enrollment by Grade Level</CardTitle>
                <CardDescription>Male vs female distribution per grade</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EnrollmentByGrade />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Gender Distribution</CardTitle>
                <CardDescription>Overall male vs female ratio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GenderPie />
          </CardContent>
        </Card>
      </div>

      {/* Section Enrollment Details */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Enrollment Details</CardTitle>
              <CardDescription>Status breakdown and top sections by enrollment count</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SectionTable />
        </CardContent>
      </Card>
    </div>
  );
}
