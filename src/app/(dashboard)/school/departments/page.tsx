"use client";
import { useState, useEffect } from "react";
import { Building2, Loader2, Users } from "lucide-react";

interface Dept { id: number; department_name: string; abbr: string | null; dept_head: string | null; personnel_count: number; }

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/school/departments")
      .then((r) => r.json())
      .then((d) => setDepts(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-xl">
          <Building2 className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-muted-foreground">{depts.length} departments</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : depts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Building2 className="h-10 w-10 opacity-30" />
          <p>No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg mt-0.5">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 leading-tight">{d.department_name}</h3>
                  {d.abbr && <p className="text-xs text-muted-foreground mt-0.5">{d.abbr}</p>}
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{d.personnel_count} personnel</span>
                  </div>
                  {d.dept_head && (
                    <p className="text-xs text-gray-600 mt-1 border-t pt-1">Head: {d.dept_head}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
