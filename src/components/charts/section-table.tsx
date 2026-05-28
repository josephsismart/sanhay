"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface SectionData {
  section: string;
  grade: string;
  count: number;
}

interface StatusData {
  status: string;
  count: number;
}

export function SectionTable() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/learners")
      .then((res) => res.json())
      .then((d) => {
        setSections(d.bySection || []);
        setStatuses(d.byStatus || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enrollment Status */}
      {statuses.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-3">Enrollment Status</h4>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => {
              const colors: Record<string, string> = {
                "Enrolled": "bg-emerald-50 text-emerald-700 border-emerald-200",
                "Dropped": "bg-red-50 text-red-700 border-red-200",
                "Transferred": "bg-amber-50 text-amber-700 border-amber-200",
              };
              return (
                <div key={s.status} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${colors[s.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  <span className="text-xs font-medium">{s.status}</span>
                  <span className="text-sm font-extrabold">{s.count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Sections */}
      <div>
        <h4 className="text-sm font-bold mb-3">Top Sections by Enrollment</h4>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {sections.map((s, i) => (
            <div key={`${s.grade}-${s.section}-${i}`} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.section}</p>
                  <p className="text-xs text-muted-foreground">{s.grade}</p>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full text-xs bg-indigo-50 text-indigo-700 shrink-0 ml-2">
                {s.count.toLocaleString()}
              </Badge>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No section data</p>
          )}
        </div>
      </div>
    </div>
  );
}
