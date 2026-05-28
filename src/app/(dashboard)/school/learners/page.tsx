"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, Plus, Search, Pencil, X, ChevronLeft, ChevronRight,
  Loader2, Filter, UserCheck, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const R2 = "https://pub-750611bb5be64b558b7cd6db734b9c32.r2.dev";

interface Learner {
  id: number; lrn: string; four_ps: boolean;
  guardian: string | null; relation: string | null; contact_num: string | null;
  ffirst_name: string | null; fmiddle_name: string | null; flast_name: string | null;
  mfirst_name: string | null; mmiddle_name: string | null; mlast_name: string | null;
  basic_info_id: number; first_name: string; middle_name: string | null;
  last_name: string; suffix: string | null; birthdate: string | null;
  sex: boolean; img_path: string | null;
  enrollment_id: number | null; enroll_status_id: number | null; enroll_status: string | null;
  section_id: number | null; section_name: string | null;
  grade_level: string | null; grade_level_id: number | null; grade_order: number | null;
}

interface GradeLookup { id: number; description: string; order_by: number }
interface SectionLookup { id: number; sctn_nm: string; grade_level: string; grade_order: number }

const EMPTY = {
  firstName: "", middleName: "", lastName: "", suffix: "",
  birthdate: "", sex: "true", lrn: "", fourPs: false,
  guardian: "", relation: "", contactNum: "",
  fFirstName: "", fMiddleName: "", fLastName: "",
  mFirstName: "", mMiddleName: "", mLastName: "",
  sectionId: "none",
  basicInfoId: null as number | null, enrollmentId: null as number | null,
};

const GRADE_COLORS: Record<string, string> = {
  "GRADE 7": "bg-purple-100 text-purple-700",
  "GRADE 8": "bg-blue-100 text-blue-700",
  "GRADE 9": "bg-cyan-100 text-cyan-700",
  "GRADE 10": "bg-teal-100 text-teal-700",
  "GRADE 11": "bg-orange-100 text-orange-700",
  "GRADE 12": "bg-rose-100 text-rose-700",
};

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gradeLevels, setGradeLevels] = useState<GradeLookup[]>([]);
  const [sections, setSections] = useState<SectionLookup[]>([]);
  const [activeSy, setActiveSy] = useState<{ id: number; description: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const fetchLearners = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams({
        page: String(page), limit: String(LIMIT), search,
        ...(gradeFilter !== "all" ? { gradeId: gradeFilter } : {}),
      });
      const res = await fetch(`/api/school/learners?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLearners(data.data); setTotal(data.total);
    } catch { setError("Failed to load learners."); }
    finally { setLoading(false); }
  }, [page, search, gradeFilter]);

  const fetchLookups = useCallback(async () => {
    try {
      const res = await fetch("/api/school/learners/lookups");
      if (!res.ok) return;
      const data = await res.json();
      setGradeLevels(data.gradeLevels);
      setSections(data.sections);
      setActiveSy(data.activeSy);
    } catch {}
  }, []);

  useEffect(() => { fetchLearners(); }, [fetchLearners]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const openAdd = () => {
    setEditId(null); setForm({ ...EMPTY }); setFormError(null);
    setActiveTab("personal"); setModalOpen(true);
  };

  const openEdit = (l: Learner) => {
    setEditId(l.id);
    setForm({
      firstName: l.first_name, middleName: l.middle_name || "",
      lastName: l.last_name, suffix: l.suffix || "",
      birthdate: l.birthdate ? l.birthdate.split("T")[0] : "",
      sex: l.sex ? "true" : "false", lrn: l.lrn,
      fourPs: l.four_ps, guardian: l.guardian || "",
      relation: l.relation || "", contactNum: l.contact_num || "",
      fFirstName: l.ffirst_name || "", fMiddleName: l.fmiddle_name || "",
      fLastName: l.flast_name || "", mFirstName: l.mfirst_name || "",
      mMiddleName: l.mmiddle_name || "", mLastName: l.mlast_name || "",
      sectionId: l.section_id ? String(l.section_id) : "none",
      basicInfoId: l.basic_info_id, enrollmentId: l.enrollment_id,
    });
    setFormError(null); setActiveTab("personal"); setModalOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.firstName || !form.lastName || !form.lrn) {
      setFormError("First name, last name, and LRN are required."); return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName, middleName: form.middleName || null,
        lastName: form.lastName, suffix: form.suffix || null,
        birthdate: form.birthdate || null, sex: form.sex === "true",
        lrn: form.lrn, fourPs: form.fourPs,
        guardian: form.guardian || null, relation: form.relation || null,
        contactNum: form.contactNum || null,
        fFirstName: form.fFirstName || null, fMiddleName: form.fMiddleName || null,
        fLastName: form.fLastName || null, mFirstName: form.mFirstName || null,
        mMiddleName: form.mMiddleName || null, mLastName: form.mLastName || null,
        sectionId: (form.sectionId && form.sectionId !== "none") ? Number(form.sectionId) : null,
        basicInfoId: form.basicInfoId, enrollmentId: form.enrollmentId,
      };
      const url = editId ? `/api/school/learners/${editId}` : "/api/school/learners";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      setModalOpen(false); fetchLearners();
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const initials = (l: Learner) => `${l.first_name?.[0] || ""}${l.last_name?.[0] || ""}`.toUpperCase();
  const gradeColor = (gl: string | null) => gl ? (GRADE_COLORS[gl] || "bg-gray-100 text-gray-600") : "bg-gray-100 text-gray-500";
  const filteredSections = form.sectionId || gradeFilter === "all"
    ? sections
    : sections.filter((s) => String(s.id) !== ""); // show all sections in modal

  const sectionsByGrade = sections.reduce((acc, s) => {
    if (!acc[s.grade_level]) acc[s.grade_level] = [];
    acc[s.grade_level].push(s);
    return acc;
  }, {} as Record<string, SectionLookup[]>);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <GraduationCap className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learners</h1>
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()} learners · {activeSy?.description || "Current SY"}
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Enroll Learner
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name or LRN..." className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          {searchInput && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-800"
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
        <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grade Levels</SelectItem>
            {gradeLevels.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>{g.description}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500">{error}</div>
        ) : learners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <GraduationCap className="h-10 w-10 opacity-30" />
            <p>No learners found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Learner</TableHead>
                <TableHead>LRN</TableHead>
                <TableHead>Grade & Section</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>4Ps</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {learners.map((l, i) => (
                <TableRow key={l.id} className="hover:bg-violet-50/30 transition-colors">
                  <TableCell className="text-muted-foreground text-xs">{(page - 1) * LIMIT + i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={l.img_path ? `${R2}/${l.img_path}` : undefined} />
                        <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-bold">
                          {initials(l)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {l.last_name}, {l.first_name}
                          {l.middle_name ? ` ${l.middle_name[0]}.` : ""}
                          {l.suffix ? ` ${l.suffix}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {l.birthdate ? new Date(l.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{l.lrn}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {l.grade_level && (
                        <Badge variant="secondary" className={`text-[10px] w-fit ${gradeColor(l.grade_level)}`}>
                          {l.grade_level}
                        </Badge>
                      )}
                      {l.section_name && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />{l.section_name}
                        </span>
                      )}
                      {!l.grade_level && <span className="text-xs text-muted-foreground">Not enrolled</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={l.sex ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}>
                      {l.sex ? "M" : "F"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {l.four_ps ? <UserCheck className="h-4 w-4 text-green-600" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      l.enroll_status === "ENROLLED" || !l.enroll_status
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }>
                      {l.enroll_status || "Enrolled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-violet-50 hover:text-violet-600"
                        onClick={() => openEdit(l)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium text-gray-700">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700">
              <GraduationCap className="h-5 w-5" />
              {editId ? "Edit Learner" : "Enroll New Learner"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 border-b pb-2 mb-4">
            {["personal", "family", "enrollment"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${activeTab === tab ? "bg-violet-100 text-violet-700" : "text-muted-foreground hover:bg-gray-100"}`}>
                {tab === "personal" ? "Personal Info" : tab === "family" ? "Family Info" : "Enrollment"}
              </button>
            ))}
          </div>

          {activeTab === "personal" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input placeholder="DELA CRUZ" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input placeholder="JUAN" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Middle Name</Label>
                <Input placeholder="SANTOS" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Suffix</Label>
                <Input placeholder="JR., SR...." value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>LRN <span className="text-red-500">*</span></Label>
                <Input placeholder="12-digit LRN" value={form.lrn} onChange={(e) => setForm({ ...form, lrn: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-1.5">
                <Label>Sex</Label>
                <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Male</SelectItem>
                    <SelectItem value="false">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Birthdate</Label>
                <Input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
              </div>
              <div className="space-y-1.5 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.fourPs}
                    onChange={(e) => setForm({ ...form, fourPs: e.target.checked })}
                    className="rounded border-gray-300 w-4 h-4 accent-violet-600" />
                  <span className="text-sm font-medium">4Ps Beneficiary</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "family" && (
            <div className="grid gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Father</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1"><Label className="text-xs">First</Label><Input placeholder="JUAN" value={form.fFirstName} onChange={(e) => setForm({ ...form, fFirstName: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Middle</Label><Input placeholder="PEDRO" value={form.fMiddleName} onChange={(e) => setForm({ ...form, fMiddleName: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Last</Label><Input placeholder="DELA CRUZ" value={form.fLastName} onChange={(e) => setForm({ ...form, fLastName: e.target.value })} /></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mother</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1"><Label className="text-xs">First</Label><Input placeholder="MARIA" value={form.mFirstName} onChange={(e) => setForm({ ...form, mFirstName: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Middle</Label><Input placeholder="SANTOS" value={form.mMiddleName} onChange={(e) => setForm({ ...form, mMiddleName: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Last</Label><Input placeholder="REYES" value={form.mLastName} onChange={(e) => setForm({ ...form, mLastName: e.target.value })} /></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label>Guardian (if not parent)</Label>
                  <Input placeholder="Full name of guardian" value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Relation</Label>
                  <Input placeholder="e.g. Aunt" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number</Label>
                <Input placeholder="09XXXXXXXXX" value={form.contactNum} onChange={(e) => setForm({ ...form, contactNum: e.target.value })} />
              </div>
            </div>
          )}

          {activeTab === "enrollment" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Assign this learner to a section for the current school year.</p>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select value={form.sectionId} onValueChange={(v) => setForm({ ...form, sectionId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select section..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No section yet —</SelectItem>
                    {Object.entries(sectionsByGrade).sort((a, b) => {
                      const oa = sections.find(s => s.grade_level === a[0])?.grade_order || 0;
                      const ob = sections.find(s => s.grade_level === b[0])?.grade_order || 0;
                      return oa - ob;
                    }).map(([grade, secs]) => (
                      <div key={grade}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-gray-50">{grade}</div>
                        {secs.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.sctn_nm}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm mt-2">{formError}</div>
          )}

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editId ? "Save Changes" : "Enroll Learner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
