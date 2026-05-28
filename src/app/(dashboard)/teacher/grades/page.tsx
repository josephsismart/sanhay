"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen, ClipboardCheck, Star, ChevronRight, ArrowLeft,
  Save, Check, Lock, AlertCircle, Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassData {
  rssaId: number;
  sectionName: string;
  grade: string;
  subject: string;
  advisory: boolean;
  total: number;
  male: number;
  female: number;
}

interface RssaInfo {
  id: number;
  subjectName: string;
  sectionName: string;
  gradeLevel: string;
  gradingLock: boolean;
  openQuarters: number[];
}

interface LearnerGrade {
  enrollmentId: number;
  learnerId: number;
  lrn: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  sex: boolean;
  gradeId: number | null;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  remarks: string | null;
}

type GradeDraft = { [enrollmentId: number]: { q1: string; q2: string; q3: string; q4: string } };

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];
const QUARTER_KEYS = ["q1", "q2", "q3", "q4"] as const;

const GRADE_COLORS: Record<string, { bg: string; active: string }> = {
  "Grade 7":  { bg: "bg-violet-50",  active: "bg-violet-600" },
  "Grade 8":  { bg: "bg-blue-50",    active: "bg-blue-600" },
  "Grade 9":  { bg: "bg-emerald-50", active: "bg-emerald-600" },
  "Grade 10": { bg: "bg-amber-50",   active: "bg-amber-600" },
  "Grade 11": { bg: "bg-rose-50",    active: "bg-rose-600" },
  "Grade 12": { bg: "bg-indigo-50",  active: "bg-indigo-600" },
};

function getAverage(row: { q1: string; q2: string; q3: string; q4: string }) {
  const vals = [row.q1, row.q2, row.q3, row.q4]
    .map(v => (v !== "" && !isNaN(Number(v)) ? Number(v) : null))
    .filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function validateGrade(val: string): boolean {
  if (val === "") return true;
  const n = Number(val);
  return Number.isInteger(n) && n >= 60 && n <= 100;
}

// ─── Grade Sheet View ─────────────────────────────────────────────────────────

function GradeSheet({
  rssaId,
  onBack,
}: {
  rssaId: number;
  onBack: () => void;
}) {
  const [rssa, setRssa] = useState<RssaInfo | null>(null);
  const [learners, setLearners] = useState<LearnerGrade[]>([]);
  const [draft, setDraft] = useState<GradeDraft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/grades/${rssaId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load"); return; }
      setRssa(data.rssa);
      setLearners(data.learners);
      const initial: GradeDraft = {};
      for (const l of data.learners) {
        initial[l.enrollmentId] = {
          q1: l.q1 != null ? String(l.q1) : "",
          q2: l.q2 != null ? String(l.q2) : "",
          q3: l.q3 != null ? String(l.q3) : "",
          q4: l.q4 != null ? String(l.q4) : "",
        };
      }
      setDraft(initial);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [rssaId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!rssa) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const grades = learners.map(l => {
        const d = draft[l.enrollmentId] ?? { q1: "", q2: "", q3: "", q4: "" };
        return {
          enrollmentId: l.enrollmentId,
          gradeId: l.gradeId,
          q1: d.q1 !== "" ? Number(d.q1) : null,
          q2: d.q2 !== "" ? Number(d.q2) : null,
          q3: d.q3 !== "" ? Number(d.q3) : null,
          q4: d.q4 !== "" ? Number(d.q4) : null,
        };
      });
      const res = await fetch(`/api/teacher/grades/${rssaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed"); return; }
      setSaved(true);
      // Refresh to get gradeIds for newly inserted rows
      await load();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function handleCell(enrollmentId: number, quarter: typeof QUARTER_KEYS[number], value: string) {
    setSaved(false);
    setDraft(prev => ({
      ...prev,
      [enrollmentId]: { ...(prev[enrollmentId] ?? { q1: "", q2: "", q3: "", q4: "" }), [quarter]: value },
    }));
  }

  const filtered = learners.filter(l =>
    search === "" ||
    `${l.lastName} ${l.firstName}`.toLowerCase().includes(search.toLowerCase()) ||
    l.lrn?.toLowerCase().includes(search.toLowerCase())
  );

  const hasErrors = learners.some(l =>
    QUARTER_KEYS.some(k => !validateGrade(draft[l.enrollmentId]?.[k] ?? ""))
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!rssa) return (
    <div className="text-center text-sm text-muted-foreground py-16">
      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
      {error || "Could not load grade sheet"}
      <div className="mt-4"><Button variant="outline" size="sm" onClick={onBack}>Go back</Button></div>
    </div>
  );

  const colorsKey = Object.keys(GRADE_COLORS).find(k => rssa.gradeLevel?.includes(k.replace("Grade ", ""))) || "";
  const colors = GRADE_COLORS[colorsKey] ?? { bg: "bg-indigo-50", active: "bg-indigo-600" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold tracking-tight">{rssa.subjectName}</h1>
          <p className="text-sm text-muted-foreground">
            {rssa.gradeLevel} &mdash; {rssa.sectionName} &bull; {learners.length} learners
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rssa.gradingLock && (
            <Badge variant="secondary" className="gap-1 bg-red-50 text-red-600 border-red-200">
              <Lock className="h-3 w-3" /> Locked
            </Badge>
          )}
          {!rssa.gradingLock && (
            <Button
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSave}
              disabled={saving || hasErrors}
            >
              {saving ? (
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : saved ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Grades"}
            </Button>
          )}
        </div>
      </div>

      {/* Quarter status pills */}
      <div className="flex gap-2 flex-wrap">
        {QUARTER_LABELS.map((q, i) => {
          const isOpen = rssa.openQuarters.includes(i + 1);
          return (
            <div key={q} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium
              ${isOpen ? `${colors.bg} border-current text-current` : "bg-muted/30 text-muted-foreground border-muted"}`}>
              {isOpen ? <Check className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {q} {isOpen ? "Open" : "Locked"}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Search learner name or LRN…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Grade table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold w-8">#</th>
              <th className="px-4 py-3 text-left font-semibold min-w-[180px]">Learner</th>
              <th className="px-4 py-3 text-center font-semibold text-[11px] text-muted-foreground w-10">M/F</th>
              {QUARTER_LABELS.map((q, i) => {
                const isOpen = rssa.openQuarters.includes(i + 1);
                return (
                  <th key={q} className={`px-3 py-3 text-center font-semibold w-20 ${isOpen ? "text-indigo-700" : "text-muted-foreground"}`}>
                    <span className="flex items-center justify-center gap-1">
                      {q} {!isOpen && <Lock className="h-2.5 w-2.5" />}
                    </span>
                  </th>
                );
              })}
              <th className="px-3 py-3 text-center font-semibold w-16 text-muted-foreground text-[11px]">AVG</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No learners found
                </td>
              </tr>
            )}
            {filtered.map((l, idx) => {
              const d = draft[l.enrollmentId] ?? { q1: "", q2: "", q3: "", q4: "" };
              const avg = getAverage(d);
              const passing = avg != null ? avg >= 75 : null;
              return (
                <tr key={l.enrollmentId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium leading-tight">
                      {l.lastName}, {l.firstName}{l.middleName ? ` ${l.middleName[0]}.` : ""}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{l.lrn || "—"}</div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${l.sex ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
                      {l.sex ? "M" : "F"}
                    </span>
                  </td>
                  {QUARTER_KEYS.map((qk, qi) => {
                    const isOpen = rssa.openQuarters.includes(qi + 1);
                    const val = d[qk];
                    const isInvalid = val !== "" && !validateGrade(val);
                    return (
                      <td key={qk} className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          min={60}
                          max={100}
                          value={val}
                          disabled={!isOpen || rssa.gradingLock}
                          onChange={e => handleCell(l.enrollmentId, qk, e.target.value)}
                          className={`w-16 text-center text-sm rounded-lg border px-2 py-1 outline-none transition-all
                            ${!isOpen || rssa.gradingLock
                              ? "bg-muted/30 text-muted-foreground cursor-not-allowed border-transparent"
                              : isInvalid
                              ? "border-red-400 bg-red-50 text-red-700 focus:ring-1 focus:ring-red-400"
                              : "border-input bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                            }`}
                          placeholder="—"
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    {avg !== null ? (
                      <span className={`text-sm font-bold ${passing ? "text-emerald-600" : "text-red-500"}`}>
                        {avg}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      {learners.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {learners.length} total</span>
          <span className="text-blue-600">{learners.filter(l => l.sex).length} M</span>
          <span className="text-pink-600">{learners.filter(l => !l.sex).length} F</span>
        </div>
      )}
    </div>
  );
}

// ─── Class List View ──────────────────────────────────────────────────────────

export default function GradesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRssa, setActiveRssa] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/teacher")
      .then(res => res.json())
      .then(d => {
        setClasses(d.classes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (activeRssa !== null) {
    return (
      <GradeSheet rssaId={activeRssa} onBack={() => setActiveRssa(null)} />
    );
  }

  // Group by section for display
  const sections = Array.from(new Set(classes.map(c => `${c.grade}|||${c.sectionName}`))).map(key => {
    const [grade, sectionName] = key.split("|||");
    const subjects = classes.filter(c => c.grade === grade && c.sectionName === sectionName);
    return { grade, sectionName, subjects };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Grades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a subject to enter or update grades
        </p>
      </div>

      {sections.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No classes assigned</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sections.map(({ grade, sectionName, subjects }) => {
            const colorsKey = Object.keys(GRADE_COLORS).find(k => grade?.includes(k.replace("Grade ", ""))) || "";
            const colors = GRADE_COLORS[colorsKey] ?? { bg: "bg-indigo-50", active: "bg-indigo-600" };
            const advisory = subjects.find(s => s.advisory);
            return (
              <div key={`${grade}-${sectionName}`}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${colors.bg}`}>
                    {advisory && <Star className={`h-3.5 w-3.5 ${colors.active.replace("bg-", "text-")}`} />}
                    <span className={`text-xs font-bold ${colors.active.replace("bg-", "text-")}`}>
                      {grade} &mdash; {sectionName}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{subjects[0]?.total ?? 0} learners</span>
                </div>

                {/* Subject cards */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {subjects.map(c => (
                    <button
                      key={c.rssaId}
                      onClick={() => setActiveRssa(c.rssaId)}
                      className="group text-left rounded-xl border bg-white px-4 py-3 hover:shadow-md hover:border-indigo-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center ${c.advisory ? "bg-amber-50 text-amber-600" : `${colors.bg} ${colors.active.replace("bg-", "text-")}`}`}>
                            {c.advisory ? <Star className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold leading-tight truncate">{c.subject}</p>
                            {c.advisory && (
                              <span className="text-[10px] text-amber-600 font-medium">Advisory</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 flex-shrink-0 mt-0.5 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
