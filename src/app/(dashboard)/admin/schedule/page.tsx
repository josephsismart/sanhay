"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarClock, Search, Users, GraduationCap, Loader2,
  AlertTriangle, BookOpen, MapPin, Printer, Clock,
} from "lucide-react";

interface Section {
  id: number; name: string; gradeLevelId: number | null;
  gradeLabel: string | null; blockCount: number;
}
interface Teacher {
  id: number; employeeId: string | null; fullName: string;
  firstName: string; lastName: string; department: string | null;
  blockCount: number;
}
interface ScheduleBlock {
  id: number; day: string; fromTime: string; toTime: string;
  fromOrder: number; toOrder: number;
  rssaId: number; advisory: boolean; teaching: boolean;
  subject: string | null; subjectAbbr: string | null;
  nonTeachingLabel: string | null;
  sectionId: number; sectionName: string;
  roomName: string | null;
  teacherId: number | null; teacherName: string | null;
}
interface Conflict {
  dayKey: string;
  ids: number[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "MON", Tuesday: "TUE", Wednesday: "WED",
  Thursday: "THU", Friday: "FRI",
};

// Color palette for subjects (deterministic by subject name)
const SUBJECT_COLORS = [
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];
function subjectColor(name: string | null): string {
  if (!name) return "bg-slate-50 text-slate-600 border-slate-200";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

export default function SchedulePage() {
  const [mode, setMode] = useState<"section" | "teacher">("section");
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [pickersLoading, setPickersLoading] = useState(true);

  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load pickers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/schedule/pickers");
        const json = await res.json();
        if (res.ok) {
          setSections(json.sections || []);
          setTeachers(json.teachers || []);
          // Auto-select first section with schedule
          const firstWithSchedule = (json.sections as Section[]).find((s) => s.blockCount > 0);
          if (firstWithSchedule) setSelectedSection(firstWithSchedule.id);
        }
      } finally {
        setPickersLoading(false);
      }
    })();
  }, []);

  // Load schedule
  const loadSchedule = useCallback(async () => {
    if (mode === "section" && !selectedSection) return;
    if (mode === "teacher" && !selectedTeacher) return;
    setLoading(true);
    try {
      const params =
        mode === "section"
          ? `mode=section&sectionId=${selectedSection}`
          : `mode=teacher&teacherId=${selectedTeacher}`;
      const res = await fetch(`/api/admin/schedule?${params}`);
      const json = await res.json();
      if (res.ok) {
        setBlocks(json.blocks || []);
        setConflicts(json.conflicts || []);
        setMeta(json.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [mode, selectedSection, selectedTeacher]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  // Filter pickers by search
  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const s = search.toLowerCase();
    return sections.filter(
      (x) => x.name?.toLowerCase().includes(s) || x.gradeLabel?.toLowerCase().includes(s)
    );
  }, [sections, search]);

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers;
    const s = search.toLowerCase();
    return teachers.filter(
      (x) =>
        x.fullName?.toLowerCase().includes(s) ||
        x.firstName?.toLowerCase().includes(s) ||
        x.lastName?.toLowerCase().includes(s) ||
        x.department?.toLowerCase().includes(s)
    );
  }, [teachers, search]);

  // Group blocks by day
  const byDay = useMemo(() => {
    const out: Record<string, ScheduleBlock[]> = {};
    DAYS.forEach((d) => (out[d] = []));
    blocks.forEach((b) => {
      if (!out[b.day]) out[b.day] = [];
      out[b.day].push(b);
    });
    // Sort each day by fromOrder
    Object.keys(out).forEach((d) => out[d].sort((a, b) => a.fromOrder - b.fromOrder));
    return out;
  }, [blocks]);

  // Conflict block IDs set for quick lookup
  const conflictIds = useMemo(() => {
    const s = new Set<number>();
    conflicts.forEach((c) => c.ids.forEach((id) => s.add(id)));
    return s;
  }, [conflicts]);

  const blocksCount = blocks.length;
  const daysCovered = DAYS.filter((d) => (byDay[d] || []).length > 0).length;

  const titleText =
    mode === "section"
      ? meta?.sctn_nm ?? "Select a section"
      : meta?.full_name ?? "Select a teacher";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-indigo-600" />
            Schedule
          </h1>
          <p className="text-sm text-muted-foreground">
            View weekly timetables for sections and teachers.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} disabled={blocksCount === 0}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as "section" | "teacher")}>
        <TabsList>
          <TabsTrigger value="section" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> By Section
          </TabsTrigger>
          <TabsTrigger value="teacher" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> By Teacher
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4">
        {/* Picker sidebar */}
        <Card className="lg:max-h-[calc(100vh-260px)] lg:overflow-hidden flex flex-col">
          <CardContent className="p-3 flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={mode === "section" ? "Search sections…" : "Search teachers…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <div className="overflow-y-auto flex-1 -mx-1 px-1">
              {pickersLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
                </div>
              ) : mode === "section" ? (
                <div className="space-y-1">
                  {filteredSections.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No sections found</p>
                  ) : (
                    filteredSections.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSection(s.id)}
                        className={
                          "w-full text-left rounded-md px-3 py-2 transition flex items-center justify-between gap-2 " +
                          (selectedSection === s.id
                            ? "bg-indigo-100 text-indigo-900"
                            : "hover:bg-muted/60")
                        }
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.gradeLabel || "—"}</p>
                        </div>
                        {s.blockCount > 0 ? (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {s.blockCount}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTeachers.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No teachers with schedule blocks yet
                    </p>
                  ) : (
                    filteredTeachers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTeacher(t.id)}
                        className={
                          "w-full text-left rounded-md px-3 py-2 transition flex items-center justify-between gap-2 " +
                          (selectedTeacher === t.id
                            ? "bg-indigo-100 text-indigo-900"
                            : "hover:bg-muted/60")
                        }
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.fullName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {t.department || "—"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {t.blockCount}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main area */}
        <div className="space-y-4">
          {/* Meta header */}
          {meta && (
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{titleText}</h2>
                  {mode === "section" ? (
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      {meta.grade_label && <span>{meta.grade_label}</span>}
                      {meta.adviser_name && (
                        <>
                          <span>·</span>
                          <span>Adviser: <strong>{meta.adviser_name}</strong></span>
                        </>
                      )}
                      {meta.room_name && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {meta.room_name}
                          </span>
                        </>
                      )}
                      {meta.strand_name && (
                        <>
                          <span>·</span>
                          <span>{meta.strand_name}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      {meta.employee_id && <span>ID: {meta.employee_id}</span>}
                      {meta.department_name && (
                        <>
                          <span>·</span>
                          <span>{meta.department_name}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" /> {blocksCount} blocks
                  </Badge>
                  <Badge variant="outline">{daysCovered} / 5 days</Badge>
                  {conflicts.length > 0 && (
                    <Badge className="gap-1 bg-rose-100 text-rose-700 hover:bg-rose-100">
                      <AlertTriangle className="h-3 w-3" /> {conflicts.length} conflict
                      {conflicts.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule grid */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-6 w-6 animate-spin inline mr-2 text-indigo-600" />
                  Loading schedule…
                </div>
              ) : blocksCount === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {!selectedSection && !selectedTeacher
                      ? "Select a section or teacher from the list."
                      : "No schedule blocks yet for this selection."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-5 divide-x">
                  {DAYS.map((day) => (
                    <div key={day} className="flex flex-col">
                      {/* Day header */}
                      <div className="text-center py-2 border-b bg-muted/50 sticky top-0 z-10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {DAY_SHORT[day]}
                        </p>
                        <p className="text-xs font-semibold mt-0.5">{day}</p>
                      </div>
                      <div className="flex-1 p-2 space-y-1.5 min-h-[200px]">
                        {(byDay[day] || []).length === 0 ? (
                          <p className="text-[10px] text-center text-muted-foreground py-4">
                            No classes
                          </p>
                        ) : (
                          (byDay[day] || []).map((b) => {
                            const isConflict = conflictIds.has(b.id);
                            const colorClass = b.teaching
                              ? subjectColor(b.subject)
                              : "bg-slate-100 text-slate-700 border-slate-200";
                            return (
                              <div
                                key={b.id}
                                className={
                                  "rounded-md border px-2 py-1.5 text-[11px] leading-tight " +
                                  colorClass +
                                  (isConflict ? " ring-2 ring-rose-400 ring-offset-1" : "")
                                }
                              >
                                <p className="font-semibold flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5 opacity-70" />
                                  {b.fromTime} – {b.toTime}
                                </p>
                                {b.teaching ? (
                                  <>
                                    <p className="font-bold truncate mt-0.5" title={b.subject || ""}>
                                      {b.subject || "—"}
                                    </p>
                                    {mode === "section" ? (
                                      b.teacherName && (
                                        <p className="truncate opacity-80 mt-0.5">
                                          {b.teacherName}
                                          {b.advisory && (
                                            <Badge className="ml-1 text-[8px] px-1 py-0 h-3.5 bg-indigo-600">
                                              ADV
                                            </Badge>
                                          )}
                                        </p>
                                      )
                                    ) : (
                                      <p className="truncate opacity-80 mt-0.5 flex items-center gap-1">
                                        <BookOpen className="h-2.5 w-2.5" />
                                        {b.sectionName}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="italic opacity-80 mt-0.5">
                                    {b.nonTeachingLabel || "Non-teaching"}
                                  </p>
                                )}
                                {isConflict && (
                                  <p className="mt-1 text-[9px] font-bold text-rose-700 flex items-center gap-1">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Conflict
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conflict details */}
          {conflicts.length > 0 && (
            <Card className="border-rose-200 bg-rose-50/40">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="h-4 w-4" /> Schedule Conflicts ({conflicts.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Two or more blocks overlap on the same day. Review and adjust the time ranges.
                </p>
                <ul className="mt-2 text-xs space-y-1">
                  {conflicts.slice(0, 5).map((c, i) => {
                    const items = c.ids
                      .map((id) => blocks.find((b) => b.id === id))
                      .filter(Boolean) as ScheduleBlock[];
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>
                          {c.dayKey}:{" "}
                          {items
                            .map(
                              (b) =>
                                `${b.subject || b.nonTeachingLabel || "—"} (${b.fromTime}–${b.toTime})`
                            )
                            .join(" ↔ ")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
