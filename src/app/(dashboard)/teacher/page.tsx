"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  GraduationCap,
  ClipboardCheck,
  Star,
} from "lucide-react";

interface ClassData {
  rssaId: number;
  sectionName: string;
  grade: string;
  subject: string;
  advisory: boolean;
  room: string;
  male: number;
  female: number;
  total: number;
}

interface Stats {
  totalClasses: number;
  advisoryClasses: number;
  totalStudents: number;
  uniqueSections: number;
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [stats, setStats] = useState<Stats>({ totalClasses: 0, advisoryClasses: 0, totalStudents: 0, uniqueSections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher")
      .then((res) => res.json())
      .then((d) => {
        setClasses(d.classes || []);
        setStats(d.stats || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your classes and assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "My Classes", value: stats.totalClasses, icon: BookOpen, color: "text-indigo-600 bg-indigo-50", desc: "Subject assignments" },
          { label: "Sections", value: stats.uniqueSections, icon: GraduationCap, color: "text-emerald-600 bg-emerald-50", desc: "Unique sections" },
          { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-600 bg-blue-50", desc: "Across all classes" },
          { label: "Advisory", value: stats.advisoryClasses, icon: Star, color: "text-amber-600 bg-amber-50", desc: "Advisory classes" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
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

      {/* My Classes Table */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">My Assigned Classes</CardTitle>
              <CardDescription>All subject-section assignments for this school year</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No classes assigned yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Grade & Section</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Subject</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">Room</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Male</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Female</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c, i) => (
                    <tr key={c.rssaId} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div>
                          <span className="font-medium">{c.grade}</span>
                          <span className="text-muted-foreground"> - {c.sectionName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{c.subject}</td>
                      <td className="py-2.5 px-3 hidden sm:table-cell text-muted-foreground">{c.room}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-blue-600 font-medium">{c.male}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-pink-600 font-medium">{c.female}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{c.total}</td>
                      <td className="py-2.5 px-3 text-center">
                        {c.advisory ? (
                          <Badge className="rounded-full text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                            Advisory
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full text-[10px]">
                            Subject
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
