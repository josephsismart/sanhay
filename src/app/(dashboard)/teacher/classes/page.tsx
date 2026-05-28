"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

export default function MyClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [learners, setLearners] = useState<any[]>([]);
  const [learnersLoading, setLearnersLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/teacher")
      .then((res) => res.json())
      .then((d) => {
        setClasses(d.classes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleClass = async (rssaId: number) => {
    if (expandedClass === rssaId) {
      setExpandedClass(null);
      setLearners([]);
      return;
    }
    setExpandedClass(rssaId);
    setLearnersLoading(true);
    try {
      const res = await fetch(`/api/teacher/learners?rssaId=${rssaId}`);
      const data = await res.json();
      setLearners(data || []);
    } catch {
      setLearners([]);
    }
    setLearnersLoading(false);
  };

  const filteredLearners = learners.filter((l) =>
    `${l.lrn} ${l.name}`.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-extrabold tracking-tight">My Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Click on a class to view the enrolled learners
        </p>
      </div>

      {classes.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No classes assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <Card key={c.rssaId} className="bg-white overflow-hidden">
              <button
                onClick={() => toggleClass(c.rssaId)}
                className="w-full text-left"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.advisory ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}>
                        {c.advisory ? <Star className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold">{c.grade} - {c.sectionName}</CardTitle>
                          {c.advisory && (
                            <Badge className="rounded-full text-[10px] bg-amber-100 text-amber-700 border-amber-200">Advisory</Badge>
                          )}
                        </div>
                        <CardDescription>{c.subject} &middot; {c.room}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-3 text-sm">
                        <span className="text-blue-600 font-medium">{c.male}M</span>
                        <span className="text-pink-600 font-medium">{c.female}F</span>
                        <span className="font-bold">{c.total}</span>
                      </div>
                      {expandedClass === c.rssaId ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {expandedClass === c.rssaId && (
                <CardContent className="border-t pt-4">
                  {learnersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    </div>
                  ) : learners.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No learners enrolled in this class</p>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative flex-1 max-w-xs">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or LRN..."
                            className="pl-9 h-9 rounded-lg text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                        <Badge variant="secondary" className="rounded-full">{filteredLearners.length} learners</Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground w-8">#</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">LRN</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                              <th className="text-center py-2 px-3 font-medium text-muted-foreground">Sex</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Birthdate</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLearners.map((l, i) => (
                              <tr key={l.lrn} className="border-b hover:bg-muted/20 transition-colors">
                                <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                                <td className="py-2 px-3 font-mono text-xs">{l.lrn}</td>
                                <td className="py-2 px-3 font-medium">{l.name}</td>
                                <td className="py-2 px-3 text-center">
                                  <Badge variant="secondary" className={`rounded-full text-[10px] ${l.sex ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                                    {l.sex ? "M" : "F"}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-muted-foreground hidden md:table-cell">{l.birthdate || "-"}</td>
                                <td className="py-2 px-3 hidden lg:table-cell">
                                  <Badge variant="secondary" className="rounded-full text-[10px] bg-emerald-50 text-emerald-700">
                                    {l.status || "Enrolled"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
