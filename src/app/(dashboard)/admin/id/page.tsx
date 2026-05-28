"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Search, Printer, IdCard, Users, Loader2, ChevronLeft, ChevronRight, CheckSquare, Square,
} from "lucide-react";

interface Section {
  id: number;
  sctn_nm: string;
  grade_level: string;
  grade_level_id: number;
  grade_order: number;
  advisory_teacher: string | null;
  learner_count: number;
}

interface Learner {
  id: number;
  lrn: string;
  basicInfoId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  birthdate: string | null;
  sex: boolean;
  imgPath: string | null;
  sectionName: string | null;
  gradeLevel: string | null;
  advisoryTeacher: string | null;
  strand: string | null;
}

function buildA4PrintHtml(learners: Learner[], schoolYear: string): string {
  const cards = learners.map((l) => {
    const fullName = [l.lastName, l.firstName, l.middleName ? l.middleName[0] + "." : ""].filter(Boolean).join(" ");
    const birthdate = l.birthdate
      ? new Date(l.birthdate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
      : "--";
    const adviser = l.advisoryTeacher ?? "--";
    const gradeSection = `${l.gradeLevel ?? ""} - ${l.sectionName ?? ""}`;
    const photo = l.imgPath
      ? `<img src="${l.imgPath}" style="width:100%;height:100%;object-fit:cover;"/>`
      : `<div style="width:100%;height:100%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#1e40af;">${(l.firstName?.[0]??"")}${(l.lastName?.[0]??"")}</div>`;

    const frontCard = `
<div class="id-card">
  <div class="face front" style="background-image:url('/id-front.png')">
    <div class="photo-box">${photo}</div>
    <div class="qr-box">
      <div class="qr-placeholder"></div>
      <div class="lrn-num">${l.lrn}</div>
      <div class="level-badge">${l.gradeLevel ?? ""}</div>
    </div>
    <div class="name-row">${l.lrn}</div>
    <div class="name-big">${l.lastName}<br/>${l.firstName} ${l.middleName ? l.middleName[0]+"." : ""}</div>
    <div class="info-row"><span class="info-lbl">Birthdate:</span> <span class="info-val">${birthdate}</span></div>
    <div class="info-row"><span class="info-lbl">Grade &amp; Section:</span> <span class="info-val grade-val">${gradeSection}</span></div>
    <div class="info-row"><span class="info-lbl">Adviser:</span> <span class="info-val">${adviser}</span></div>
  </div>
</div>`;

    const backCard = `
<div class="id-card">
  <div class="face back" style="background-image:url('/id-back.png')">
    <div class="emergency-section">
      <div class="guardian-name">${"PARENT/GUARDIAN"}</div>
      <div class="guardian-addr">--</div>
    </div>
  </div>
</div>`;

    return { frontCard, backCard };
  });

  // Pair up: for each 2 learners, front side row + back side row
  let rows = "";
  for (let i = 0; i < cards.length; i += 2) {
    const c1 = cards[i];
    const c2 = cards[i + 1];
    rows += `<div class="id-row">
  ${c1.frontCard}
  ${c2 ? c2.frontCard : '<div class="id-card empty"></div>'}
</div>
<div class="id-row">
  ${c1.backCard}
  ${c2 ? c2.backCard : '<div class="id-card empty"></div>'}
</div>`;
  }

  return `<!DOCTYPE html><html><head><title>Student ID Cards</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:white;font-family:Arial,sans-serif;}
.page{padding:10mm;display:flex;flex-direction:column;gap:4mm;}
.id-row{display:flex;gap:4mm;justify-content:center;page-break-inside:avoid;}
.id-card{width:85.6mm;height:54mm;position:relative;border-radius:3mm;overflow:hidden;border:0.3mm solid #ccc;}
.id-card.empty{border:none;}
.face{width:100%;height:100%;background-size:cover;background-position:center;position:relative;}
.front .photo-box{position:absolute;left:4mm;top:12mm;width:24mm;height:27mm;overflow:hidden;border:0.5mm solid #999;}
.front .qr-box{position:absolute;right:4mm;top:11mm;text-align:center;}
.front .qr-placeholder{width:18mm;height:18mm;background:#000;margin:0 auto;}
.front .lrn-num{font-size:5pt;text-align:center;margin-top:1mm;font-weight:bold;}
.front .level-badge{font-size:5pt;color:#c00;font-weight:bold;text-align:center;margin-top:0.5mm;}
.front .name-row{position:absolute;left:4mm;bottom:18mm;font-size:7pt;font-weight:bold;color:#0050a0;}
.front .name-big{position:absolute;left:4mm;bottom:10mm;font-size:9pt;font-weight:bold;line-height:1.2;color:#222;}
.front .info-row{position:absolute;left:4mm;font-size:5.5pt;line-height:1.4;color:#333;}
.front .info-row:nth-of-type(4){bottom:7mm;}
.front .info-row:nth-of-type(5){bottom:4.5mm;}
.front .info-row:nth-of-type(6){bottom:2mm;}
.info-lbl{color:#0078c8;font-weight:bold;}
.grade-val{color:#0078c8;font-weight:bold;}
.back .emergency-section{position:absolute;top:22mm;left:50%;transform:translateX(-50%);text-align:center;width:60mm;}
.guardian-name{font-size:7pt;font-weight:bold;color:#0050a0;letter-spacing:0.05em;}
.guardian-addr{font-size:6pt;color:#555;margin-top:1mm;}
@media print{
  body{margin:0;}
  .page{padding:8mm;}
  @page{size:A4 portrait;margin:0;}
}
</style></head><body>
<div class="page">${rows}</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body></html>`;
}

export default function IdCardPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<{id:number;label:string}[]>([]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const schoolYear = "SY 2025-2026";

  // Load sections
  useEffect(() => {
    fetch("/api/admin/id-sections")
      .then(r => r.json())
      .then(d => {
        const secs: Section[] = d.data ?? [];
        setSections(secs);
        const seen = new Set<number>();
        const gl: {id:number;label:string}[] = [];
        secs.forEach(s => {
          if (!seen.has(s.grade_level_id)) {
            seen.add(s.grade_level_id);
            gl.push({ id: s.grade_level_id, label: s.grade_level });
          }
        });
        setGrades(gl.sort((a,b) => a.grade_order - b.grade_order));
      })
      .catch(e => console.error("Sections load error:", e))
      .finally(() => setLoadingSections(false));
  }, []);

  // Load learners for selected section
  const loadLearners = useCallback(async (sectionId: number) => {
    setLoadingLearners(true);
    setSelected(new Set());
    try {
      const res = await fetch(`/api/admin/id-card?sectionId=${sectionId}&limit=200`);
      const json = await res.json();
      setLearners(json.data ?? []);
    } finally {
      setLoadingLearners(false);
    }
  }, []);

  const handleSectionClick = (sec: Section) => {
    setSelectedSection(sec);
    loadLearners(sec.id);
    setSearch("");
  };

  const toggleLearner = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const visible = filtered.map(l => l.id);
    const allSelected = visible.every(id => selected.has(id));
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); visible.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); visible.forEach(id => n.add(id)); return n; });
    }
  };

  const handlePrint = () => {
    const toPrint = learners.filter(l => selected.has(l.id));
    if (!toPrint.length) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(buildA4PrintHtml(toPrint, schoolYear));
    w.document.close();
  };

  const filteredSections = sections.filter(s =>
    (gradeFilter === "all" || s.grade_level_id === Number(gradeFilter))
  );

  const filtered = learners.filter(l =>
    !search || `${l.lastName} ${l.firstName} ${l.lrn}`.toLowerCase().includes(search.toLowerCase())
  );

  const allVisibleSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id));

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* LEFT: Section list */}
      <div className="w-72 shrink-0 border-r flex flex-col bg-gray-50/50">
        <div className="px-4 pt-5 pb-3 border-b">
          <h2 className="font-bold text-base flex items-center gap-2">
            <IdCard className="h-4 w-4 text-indigo-600" /> ID Card Generator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Select a section to load learners</p>
          <div className="mt-3">
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(g => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loadingSections ? (
            <div className="flex justify-center pt-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
          ) : filteredSections.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground pt-8">No sections found</p>
          ) : (
            filteredSections.map(sec => (
              <button
                key={sec.id}
                onClick={() => handleSectionClick(sec)}
                className={`w-full text-left px-4 py-2.5 border-b border-gray-100 transition-colors hover:bg-indigo-50 ${selectedSection?.id === sec.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{sec.sctn_nm}</span>
                  <Badge variant="secondary" className="text-[10px] rounded-full px-1.5">{sec.grade_level}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {sec.advisory_teacher ?? "No adviser"} &middot; {sec.learner_count} learners
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Learners */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedSection ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Users className="h-14 w-14 opacity-20" />
            <p className="text-sm">Select a section from the left to view learners</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-base">{selectedSection.sctn_nm}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedSection.grade_level} &middot; {selectedSection.advisory_teacher ?? "No adviser"} &middot; {learners.length} learners
                </p>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search learner..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs w-44 rounded-lg"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-lg gap-1.5"
                  onClick={toggleAll}
                >
                  {allVisibleSelected
                    ? <><CheckSquare className="h-3.5 w-3.5" /> Deselect all</>
                    : <><Square className="h-3.5 w-3.5" /> Select all</>}
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs rounded-lg gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                  disabled={selected.size === 0}
                  onClick={handlePrint}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print {selected.size > 0 ? `(${selected.size})` : ""} IDs
                </Button>
              </div>
            </div>

            {/* Learner list */}
            {loadingLearners ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No learners found
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="w-10 px-4 py-2.5">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={toggleAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">#</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">LRN</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Sex</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Birthdate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l, idx) => {
                      const isSelected = selected.has(l.id);
                      const birthdate = l.birthdate
                        ? new Date(l.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
                        : "--";
                      const initials = (l.firstName?.[0]??"") + (l.lastName?.[0]??"");
                      return (
                        <tr
                          key={l.id}
                          onClick={() => toggleLearner(l.id)}
                          className={`border-b cursor-pointer transition-colors hover:bg-indigo-50/60 ${isSelected ? "bg-indigo-50" : ""}`}
                        >
                          <td className="px-4 py-2.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleLearner(l.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0 overflow-hidden">
                                {l.imgPath
                                  ? <img src={l.imgPath} alt="" className="w-full h-full object-cover" />
                                  : initials.toUpperCase()}
                              </div>
                              <span className="font-medium">{l.lastName}, {l.firstName}{l.middleName ? " " + l.middleName[0] + "." : ""}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{l.lrn}</td>
                          <td className="px-3 py-2.5 text-xs">{l.sex ? "M" : "F"}</td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{birthdate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
