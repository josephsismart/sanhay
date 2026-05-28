"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Printer,
  Star,
  Download,
} from "lucide-react";

interface ClassData {
  rssaId: number;
  sectionName: string;
  grade: string;
  subject: string;
  advisory: boolean;
  total: number;
}

export default function ReportsPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher")
      .then((res) => res.json())
      .then((d) => {
        setClasses(d.classes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const advisoryClasses = classes.filter(c => c.advisory);

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
        <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and print consolidated grade reports
        </p>
      </div>

      {/* Available Reports */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border-2 border-indigo-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Consolidated Grades</CardTitle>
                <CardDescription className="text-xs">Q1-Q4 grades per section</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Complete grade report showing all subjects with quarterly grades, final grade, and class ranking.
              Available for advisory classes only.
            </p>
            <Badge variant="secondary" className="rounded-full text-xs">
              {advisoryClasses.length} advisory class(es)
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-emerald-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Grade Summary</CardTitle>
                <CardDescription className="text-xs">Statistics per subject</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Summary of passing/failing rates, average grades, and performance distribution per quarter.
            </p>
            <Badge variant="secondary" className="rounded-full text-xs">
              {classes.length} class(es)
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-amber-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Honor Roll</CardTitle>
                <CardDescription className="text-xs">Top performers ranking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Ranked list of learners by general average with honors classification.
            </p>
            <Badge variant="secondary" className="rounded-full text-xs">
              Advisory only
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Advisory Classes for Report Generation */}
      {advisoryClasses.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">My Advisory Classes</CardTitle>
                <CardDescription>Select an advisory class to generate reports</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {advisoryClasses.map((c) => (
                <div key={c.rssaId} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{c.grade} - {c.sectionName}</p>
                      <p className="text-xs text-muted-foreground">{c.total} learners &middot; {c.subject}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs">
                      <Printer className="h-3.5 w-3.5" /> Print
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs">
                      <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {advisoryClasses.length === 0 && (
        <Card className="bg-white">
          <CardContent className="py-8 text-center">
            <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No advisory classes assigned. Reports are available for advisory teachers only.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
