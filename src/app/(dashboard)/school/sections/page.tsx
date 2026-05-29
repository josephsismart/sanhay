"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Loader2, Users, BookOpen, ChevronRight,
  GraduationCap, UserCheck, Search, UserX, UserRound, Plus, UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AddSectionModal } from "@/components/sections/add-section-modal";
import { EnrollLearnersModal } from "@/components/sections/enroll-learners-modal";

interface Section {
  id: number; sctn_nm: string; is_active: boolean;
  grade_level: string; grade_order: number; grade_level_id: number;
  sy_description: string; schedule: string | null;
  advisory_teacher: string | null;
  learner_count: number; subject_count: number;
}

interface Enrollee {
  learner_id: number; lrn: string; four_ps: boolean;
  first_name: string; middle_name: string | null;
  last_name: string; suffix: string | null;
  birthdate: string | null; sex: boolean; img_path: string | null;
  enrollment_id: number; enrollment_date: string | null;
  status_id: number | null; status: string | null;
}

interface Teacher {
  rssaId: number; advisory: boolean; subject: string;
  firstName: string; middleName: string | null;
  lastName: string; suffix: string | null;
  imgPath: string | null; basicInfoId: number; spId: number;
}

const GRADE_COLORS: Record<string, { bg: string; active: string; pill: string; accent: string }> = {
  "GRADE 7":  { bg: "bg-purple-50",  active: "bg-purple-600 text-white", pill: "bg-purple-100 text-purple-700 border-purple-200", accent: "text-purple-600" },
  "GRADE 8":  { bg: "bg-blue-50",    active: "bg-blue-600 text-white",   pill: "bg-blue-100 text-blue-700 border-blue-200",       accent: "text-blue-600" },
  "GRADE 9":  { bg: "bg-cyan-50",    active: "bg-cyan-600 text-white",   pill: "bg-cyan-100 text-cyan-700 border-cyan-200",       accent: "text-cyan-600" },
  "GRADE 10": { bg: "bg-teal-50",    active: "bg-teal-600 text-white",   pill: "bg-teal-100 text-teal-700 border-teal-200",       accent: "text-teal-600" },
  "GRADE 11": { bg: "bg-orange-50",  active: "bg-orange-600 text-white", pill: "bg-orange-100 text-orange-700 border-orange-200", accent: "text-orange-600" },
  "GRADE 12": { bg: "bg-rose-50",    active: "bg-rose-600 text-white",   pill: "bg-rose-100 text-rose-700 border-rose-200",       accent: "text-rose-600" },
};
const DEFAULT_COLOR = { bg: "bg-gray-50", active: "bg-gray-700 text-white", pill: "bg-gray-100 text-gray-700 border-gray-200", accent: "text-gray-600" };

type ModalTab = "learners" | "teachers";

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<string>("all");
  const [sectionSearch, setSectionSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>("learners");
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const [enrollees, setEnrollees] = useState<Enrollee[]>([]);
  const [enrolleesLoading, setEnrolleesLoading] = useState(false);
  const [enrolleeSearch, setEnrolleeSearch] = useState("");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // Add Section modal
  const [addOpen, setAddOpen] = useState(false);

  // Enroll Learners modal
  const [enrollOpen, setEnrollOpen] = useState(false);

  const reloadSections = useCallback(() => {
    setLoading(true);
    fetch("/api/school/sections")
      .then((r) => r.json())
      .then((d) => setSections(d.data || []))
      .catch(() => setError("Failed to load sections"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reloadSections(); }, [reloadSections]);

  // Reload enrollees inside section modal (called after enrollment)
  const reloadEnrollees = useCallback(() => {
    if (!selectedSection) return;
    setEnrolleesLoading(true);
    fetch(`/api/school/sections/${selectedSection.id}/enrollees`)
      .then(r => r.json()).then(d => setEnrollees(d.data || []))
      .catch(() => {}).finally(() => setEnrolleesLoading(false));
  }, [selectedSection]);

  const openSection = async (s: Section) => {
    setSelectedSection(s);
    setModalOpen(true);
    setModalTab("learners");
    setEnrolleeSearch("");
    setEnrollees([]);
    setTeachers([]);
    setEnrolleesLoading(true);
    setTeachersLoading(true);
    fetch(`/api/school/sections/${s.id}/enrollees`)
      .then(r => r.json()).then(d => setEnrollees(d.data || []))
      .catch(() => {}).finally(() => setEnrolleesLoading(false));
    fetch(`/api/school/sections/${s.id}/teachers`)
      .then(r => r.json()).then(d => setTeachers(d.data || []))
      .catch(() => {}).finally(() => setTeachersLoading(false));
  };

  const grouped = sections.reduce((acc, s) => {
    if (!acc[s.grade_level]) acc[s.grade_level] = [];
    acc[s.grade_level].push(s);
    return acc;
  }, {} as Record<string, Section[]>);

  const sortedGrades = Object.keys(grouped).sort((a, b) =>
    (grouped[a][0]?.grade_order || 0) - (grouped[b][0]?.grade_order || 0)
  );

  const visibleSections = sections.filter((s) => {
    const gradeMatch = activeGrade === "all" || s.grade_level === activeGrade;
    const searchMatch = sectionSearch === "" ||
      s.sctn_nm.toLowerCase().includes(sectionSearch.toLowerCase()) ||
      s.advisory_teacher?.toLowerCase().includes(sectionSearch.toLowerCase());
    return gradeMatch && searchMatch;
  });

  const totalLearners = sections.reduce((sum, s) => sum + s.learner_count, 0);

  const males = enrollees
    .filter(e => e.sex)
    .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
  const females = enrollees
    .filter(e => !e.sex)
    .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));

  const filterEnrollees = (list: Enrollee[]) => {
    if (!enrolleeSearch) return list;
    const q = enrolleeSearch.toLowerCase();
    return list.filter(e =>
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.lrn?.toLowerCase().includes(q)
    );
  };

  const filteredMales = filterEnrollees(males);
  const filteredFemales = filterEnrollees(females);
  const fourPsCount = enrollees.filter(e => e.four_ps).length;

  const initials = (first: string, last: string) =>
    `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

  const EnrolleeRow = ({ e, idx }: { e: Enrollee; idx: number }) => (
    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2 text-muted-foreground text-xs w-8">{idx + 1}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className={`text-[10px] font-bold ${e.sex ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
              {initials(e.first_name, e.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-tight">
              {e.last_name}, {e.first_name}{e.middle_name ? ` ${e.middle_name[0]}.` : ""}{e.suffix ? ` ${e.suffix}` : ""}
            </p>
            <code className="text-[10px] font-mono text-muted-foreground">{e.lrn || "—"}</code>
          </div>
        </div>
      </td>
      <td className="px-4 py-2 text-center">
        {e.four_ps
          ? <UserCheck className="h-3.5 w-3.5 text-green-600 mx-auto" />
          : <span className="text-muted-foreground text-xs">—</span>}
      </td>
      <td className="px-4 py-2">
        <span className="text-xs text-muted-foreground">{e.status || "—"}</span>
      </td>
    </tr>
  );

  const col = selectedSection ? (GRADE_COLORS[selectedSection.grade_level] || DEFAULT_COLOR) : DEFAULT_COLOR;

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <CalendarDays className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Sections</h1>
          <p className="text-sm text-muted-foreground">
            {sections.length} sections · {totalLearners.toLocaleString()} learners · {sections[0]?.sy_description || "Current SY"}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add Section
        </Button>
      </div>

      {!loading && sortedGrades.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search section or adviser…"
              className="pl-8 h-8 text-sm w-52"
              value={sectionSearch}
              onChange={e => setSectionSearch(e.target.value)}
            />
          </div>
          <div className="h-5 w-px bg-border" />
          {sortedGrades.map((grade) => {
            const c = GRADE_COLORS[grade] || DEFAULT_COLOR;
            const isActive = activeGrade === grade;
            return (
              <button
                key={grade}
                onClick={() => setActiveGrade(isActive ? "all" : grade)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isActive ? c.active + " border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {grade.replace("GRADE ", "G")}
                <span className="ml-1.5 text-xs opacity-70">{grouped[grade].length}</span>
              </button>
            );
          })}
          {(activeGrade !== "all" || sectionSearch) && (
            <button
              onClick={() => { setActiveGrade("all"); setSectionSearch(""); }}
              className="text-xs text-muted-foreground hover:text-gray-800 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visibleSections.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground text-sm">No sections found</div>
          ) : visibleSections.map((s) => {
            const c = GRADE_COLORS[s.grade_level] || DEFAULT_COLOR;
            return (
              <button
                key={s.id}
                onClick={() => openSection(s)}
                className="text-left bg-white rounded-xl border shadow-sm p-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-indigo-700 transition-colors">
                    {s.sctn_nm}
                  </h3>
                  <Badge variant="secondary" className={`text-[10px] shrink-0 ml-1 ${s.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-3 ${c.pill}`}>
                  {s.grade_level}
                </span>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-semibold text-gray-700">{s.learner_count}</span>
                      <span>learner{s.learner_count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <BookOpen className="h-3 w-3" />
                      <span>{s.subject_count} subj</span>
                    </div>
                  </div>
                  {s.advisory_teacher && (
                    <p className="text-xs text-gray-500 truncate border-t pt-1.5 mt-1.5">
                      <span className="font-medium">Adviser:</span> {s.advisory_teacher}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end mt-2 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs">View details</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) setSelectedSection(null); }}>
        <DialogContent className="!max-w-[900px] w-[90vw] max-h-[90vh] flex flex-col p-0 gap-0">
          {selectedSection && (
            <>
              <DialogHeader className="px-6 pt-5 pb-4 border-b bg-gray-50 rounded-t-xl shrink-0">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${col.bg}`}>
                    <GraduationCap className={`h-5 w-5 ${col.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg font-bold leading-tight">{selectedSection.sctn_nm}</DialogTitle>
                    <DialogDescription className="mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${col.pill}`}>
                        {selectedSection.grade_level}
                      </span>
                      {selectedSection.schedule && (
                        <span className="text-xs text-muted-foreground">{selectedSection.schedule}</span>
                      )}
                      {selectedSection.advisory_teacher && (
                        <span className="text-xs">Adviser: <span className="font-medium text-gray-700">{selectedSection.advisory_teacher}</span></span>
                      )}
                    </DialogDescription>
                  </div>
                </div>

                {!enrolleesLoading && enrollees.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-white rounded-xl border px-4 py-3 text-center">
                      <div className="text-2xl font-extrabold text-gray-900">{enrollees.length}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">Total Enrolled</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 text-center">
                      <div className="text-2xl font-extrabold text-blue-700">{males.length}</div>
                      <div className="text-[11px] text-blue-600 mt-0.5 font-medium">Male</div>
                    </div>
                    <div className="bg-pink-50 rounded-xl border border-pink-100 px-4 py-3 text-center">
                      <div className="text-2xl font-extrabold text-pink-700">{females.length}</div>
                      <div className="text-[11px] text-pink-600 mt-0.5 font-medium">Female</div>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-100 px-4 py-3 text-center">
                      <div className="text-2xl font-extrabold text-green-700">{fourPsCount}</div>
                      <div className="text-[11px] text-green-600 mt-0.5 font-medium">4Ps Beneficiaries</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                      onClick={() => setModalTab("learners")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                        modalTab === "learners" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      Learners
                      {!enrolleesLoading && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${modalTab === "learners" ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"}`}>
                          {enrollees.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setModalTab("teachers")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                        modalTab === "teachers" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Teachers & Subjects
                      {!teachersLoading && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${modalTab === "teachers" ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"}`}>
                          {teachers.length}
                        </span>
                      )}
                    </button>
                  </div>
                  {modalTab === "learners" && (
                    <Button
                      size="sm"
                      onClick={() => setEnrollOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 h-8"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Enroll Learners
                    </Button>
                  )}
                </div>

                {modalTab === "learners" && (
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or LRN…"
                      className="pl-9 h-9"
                      value={enrolleeSearch}
                      onChange={(e) => setEnrolleeSearch(e.target.value)}
                    />
                  </div>
                )}
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                {modalTab === "learners" && (
                  <>
                    {enrolleesLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                      </div>
                    ) : enrollees.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                        <UserX className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No enrollees in this section</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white border-b z-10">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Learner</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-12">4Ps</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-28">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMales.length > 0 && (
                            <>
                              <tr className="bg-blue-50">
                                <td colSpan={4} className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <UserRound className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Male</span>
                                    <span className="text-xs text-blue-500 font-medium">({filteredMales.length})</span>
                                  </div>
                                </td>
                              </tr>
                              {filteredMales.map((e, i) => <EnrolleeRow key={e.enrollment_id} e={e} idx={i} />)}
                            </>
                          )}
                          {filteredFemales.length > 0 && (
                            <>
                              <tr className="bg-pink-50">
                                <td colSpan={4} className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <UserRound className="h-3.5 w-3.5 text-pink-600" />
                                    <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">Female</span>
                                    <span className="text-xs text-pink-500 font-medium">({filteredFemales.length})</span>
                                  </div>
                                </td>
                              </tr>
                              {filteredFemales.map((e, i) => <EnrolleeRow key={e.enrollment_id} e={e} idx={i} />)}
                            </>
                          )}
                          {filteredMales.length === 0 && filteredFemales.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground text-sm">
                                No learners match your search
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </>
                )}

                {modalTab === "teachers" && (
                  <>
                    {teachersLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                      </div>
                    ) : teachers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                        <UserX className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No teachers assigned to this section</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white border-b z-10">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Teacher</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Subject</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-24">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachers.map((t, i) => (
                            <tr key={t.rssaId} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="text-[11px] font-bold bg-indigo-100 text-indigo-700">
                                      {initials(t.firstName, t.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                                    {t.lastName}, {t.firstName}{t.middleName ? ` ${t.middleName[0]}.` : ""}{t.suffix ? ` ${t.suffix}` : ""}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-700">{t.subject}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {t.advisory ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                    <GraduationCap className="h-3 w-3" />
                                    Adviser
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                    Subject
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl flex items-center justify-between shrink-0">
                {modalTab === "learners" ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {filteredMales.length + filteredFemales.length} of {enrollees.length} learner{enrollees.length !== 1 ? "s" : ""}
                      {enrolleeSearch && <> matching &ldquo;{enrolleeSearch}&rdquo;</>}
                    </p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-blue-600 font-medium">{males.length} M</span>
                      <span className="text-pink-600 font-medium">{females.length} F</span>
                      {fourPsCount > 0 && <span className="text-green-600 font-medium">{fourPsCount} 4Ps</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} · {teachers.filter(t => t.advisory).length} adviser
                    </p>
                    <span className="text-xs text-indigo-600 font-medium">{teachers.length} assigned</span>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Section modal */}
      <AddSectionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          reloadSections();
        }}
      />

      {/* Enroll Learners modal — only renders when a section is selected */}
      {selectedSection && (
        <EnrollLearnersModal
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
          sectionId={selectedSection.id}
          sectionName={selectedSection.sctn_nm}
          gradeLabel={selectedSection.grade_level}
          onEnrolled={() => {
            reloadEnrollees();
            reloadSections();
          }}
        />
      )}
    </div>
  );
}
