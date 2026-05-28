"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Printer, IdCard, User, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";

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
  gradeLevelId: number | null;
  enrollmentId: number | null;
  enrollStatusId: number | null;
}

interface Grade { id: number; label: string; }

function IdCardFront({ learner, schoolYear }: { learner: Learner; schoolYear: string }) {
  const initials = (learner.firstName?.[0] ?? "") + (learner.lastName?.[0] ?? "");
  return (
    <div
      className="relative w-[242px] h-[384px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      style={{ background: "linear-gradient(160deg,#1e3a8a 0%,#1e40af 40%,#2563eb 70%,#3b82f6 100%)", fontFamily: "Arial,sans-serif" }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute top-16 -left-6 w-20 h-20 rounded-full bg-white/5" />
      <div className="relative z-10 px-4 pt-4 pb-2 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/anhs-logo.png" alt="ANHS" className="w-8 h-8 rounded-full" />
          <div className="text-left">
            <p className="text-white text-[7px] font-bold leading-tight uppercase tracking-wide">Agusan National High School</p>
            <p className="text-blue-200 text-[6px] leading-tight">Butuan City, Agusan del Norte</p>
          </div>
        </div>
        <div className="mt-1 h-px bg-white/30" />
      </div>
      <div className="relative z-10 text-center mb-2">
        <span className="text-[9px] font-extrabold tracking-[0.25em] text-blue-200 uppercase">Student ID Card</span>
      </div>
      <div className="relative z-10 flex justify-center mb-3">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-300 flex items-center justify-center" style={{ border: "3px solid white" }}>
          {learner.imgPath
            ? <img src={learner.imgPath} alt="" className="w-full h-full object-cover" />
            : <span className="text-2xl font-bold text-white">{initials.toUpperCase()}</span>}
        </div>
      </div>
      <div className="relative z-10 text-center px-3 flex-1">
        <p className="text-white font-extrabold text-[11px] leading-tight uppercase tracking-wide">
          {learner.lastName}, {learner.firstName}{learner.suffix ? " " + learner.suffix : ""}
        </p>
        {learner.middleName && <p className="text-blue-200 text-[9px] mt-0.5">{learner.middleName}</p>}
        <div className="mt-3 space-y-1.5">
          <div className="bg-white/15 rounded-lg px-3 py-1.5">
            <p className="text-blue-200 text-[7px] uppercase tracking-wide font-semibold">Grade &amp; Section</p>
            <p className="text-white text-[10px] font-bold">{learner.gradeLevel ?? "--"} - {learner.sectionName ?? "--"}</p>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-1.5">
            <p className="text-blue-200 text-[7px] uppercase tracking-wide font-semibold">LRN</p>
            <p className="text-white text-[10px] font-mono font-bold tracking-widest">{learner.lrn}</p>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-1.5">
            <p className="text-blue-200 text-[7px] uppercase tracking-wide font-semibold">School Year</p>
            <p className="text-white text-[10px] font-bold">{schoolYear}</p>
          </div>
        </div>
      </div>
      <div className="relative z-10 px-3 pb-3 pt-2 text-center">
        <div className="h-px bg-white/20 mb-2" />
        <p className="text-blue-200 text-[6px] uppercase tracking-wider">DepEd - Region XIII - Division of Butuan City</p>
      </div>
    </div>
  );
}

function IdCardBack({ learner }: { learner: Learner }) {
  const birthdate = learner.birthdate
    ? new Date(learner.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "--";
  const fullName = [learner.firstName, learner.middleName, learner.lastName, learner.suffix].filter(Boolean).join(" ").toUpperCase();
  return (
    <div
      className="relative w-[242px] h-[384px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      style={{ background: "linear-gradient(160deg,#1e3a8a 0%,#1e40af 60%,#1d4ed8 100%)", fontFamily: "Arial,sans-serif" }}
    >
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute top-20 -left-4 w-16 h-16 rounded-full bg-white/5" />
      <div className="relative z-10 px-4 pt-4 pb-2 text-center border-b border-white/20">
        <p className="text-white text-[9px] font-bold uppercase tracking-widest">Personal Information</p>
      </div>
      <div className="relative z-10 px-4 pt-3 flex-1 space-y-2 text-[9px]">
        {([
          ["Full Name", fullName],
          ["Date of Birth", birthdate],
          ["Sex", learner.sex ? "Male" : "Female"],
          ["LRN", learner.lrn],
          ["Grade Level", learner.gradeLevel ?? "--"],
          ["Section", learner.sectionName ?? "--"],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2 border-b border-white/10 pb-1.5">
            <span className="text-blue-300 font-semibold shrink-0">{label}</span>
            <span className="text-white text-right font-medium break-all">{value}</span>
          </div>
        ))}
      </div>
      <div className="relative z-10 px-4 py-3 space-y-2">
        <div className="h-px bg-white/30" />
        <div className="flex justify-between items-end text-[7px] text-blue-300">
          <div className="text-center">
            <div className="w-24 h-px bg-white/40 mb-1" />
            <p>Student Signature</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-px bg-white/40 mb-1" />
            <p>Principal / Adviser</p>
          </div>
        </div>
      </div>
      <div className="relative z-10 px-3 pb-3 text-center">
        <div className="bg-white/15 rounded-lg px-3 py-1.5">
          <p className="text-blue-200 text-[7px]">If found, please return to:</p>
          <p className="text-white text-[8px] font-bold">Agusan National High School</p>
          <p className="text-blue-200 text-[6px]">Butuan City, Agusan del Norte</p>
        </div>
      </div>
    </div>
  );
}

function buildPrintHtml(learner: Learner, schoolYear: string): string {
  const birthdate = learner.birthdate
    ? new Date(learner.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "--";
  const fullName = [learner.firstName, learner.middleName, learner.lastName, learner.suffix].filter(Boolean).join(" ").toUpperCase();
  const initials = (learner.firstName?.[0] ?? "") + (learner.lastName?.[0] ?? "");

  return `<!DOCTYPE html><html><head><title>Student ID</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#f0f4ff;display:flex;justify-content:center;padding:30px;font-family:Arial,sans-serif;}
.wrap{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;}
.card{width:242px;height:384px;border-radius:16px;overflow:hidden;position:relative;display:flex;flex-direction:column;color:white;}
.front{background:linear-gradient(160deg,#1e3a8a 0%,#1e40af 40%,#2563eb 70%,#3b82f6 100%);}
.back{background:linear-gradient(160deg,#1e3a8a 0%,#1e40af 60%,#1d4ed8 100%);}
.hdr{padding:14px 14px 8px;text-align:center;border-bottom:1px solid rgba(255,255,255,.2);}
.logo-row{display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:4px;}
.logo{width:30px;height:30px;border-radius:50%;}
.sn{font-size:7px;font-weight:bold;text-transform:uppercase;}
.ss{font-size:6px;color:rgba(147,197,253,.9);}
.lbl{text-align:center;font-size:9px;font-weight:800;letter-spacing:.2em;color:rgba(147,197,253,.9);text-transform:uppercase;padding:6px 0;}
.photo-wrap{display:flex;justify-content:center;margin-bottom:10px;}
.photo{width:76px;height:76px;border-radius:50%;border:3px solid white;overflow:hidden;background:rgba(147,197,253,.4);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;}
.ic{text-align:center;padding:0 10px;flex:1;}
.nm{font-size:11px;font-weight:800;text-transform:uppercase;color:white;line-height:1.3;}
.nm2{font-size:9px;color:rgba(147,197,253,.9);margin-top:2px;}
.ib{background:rgba(255,255,255,.15);border-radius:8px;padding:5px 10px;margin-top:6px;}
.il{font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:rgba(147,197,253,.9);font-weight:600;}
.iv{font-size:10px;font-weight:700;}
.ft{padding:6px 10px;text-align:center;border-top:1px solid rgba(255,255,255,.2);margin-top:4px;font-size:6px;text-transform:uppercase;letter-spacing:.1em;color:rgba(147,197,253,.8);}
.bh{padding:12px 14px 8px;text-align:center;border-bottom:1px solid rgba(255,255,255,.2);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;}
.rows{padding:10px 14px;flex:1;}
.row{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:6px;margin-bottom:6px;font-size:9px;}
.rl{color:rgba(147,197,253,.9);font-weight:600;white-space:nowrap;}
.rv{color:white;font-weight:500;text-align:right;}
.sig{padding:8px 14px;}
.sl{height:1px;background:rgba(255,255,255,.3);margin-bottom:6px;}
.sr{display:flex;justify-content:space-between;font-size:7px;color:rgba(147,197,253,.8);}
.sn2{text-align:center;}
.sl2{width:80px;height:1px;background:rgba(255,255,255,.4);margin:0 auto 3px;}
.fb{margin:0 12px 10px;background:rgba(255,255,255,.12);border-radius:8px;padding:6px 10px;text-align:center;}
.fb1{font-size:7px;color:rgba(147,197,253,.8);}
.fb2{font-size:8px;font-weight:700;}
.fb3{font-size:6px;color:rgba(147,197,253,.7);}
@media print{body{background:white;padding:10px;}}
</style></head><body>
<div class="wrap">
<div class="card front">
  <div class="hdr">
    <div class="logo-row">
      <img src="/anhs-logo.png" class="logo" alt="ANHS"/>
      <div><div class="sn">Agusan National High School</div><div class="ss">Butuan City, Agusan del Norte</div></div>
    </div>
  </div>
  <div class="lbl">Student ID Card</div>
  <div class="photo-wrap"><div class="photo">${learner.imgPath ? `<img src="${learner.imgPath}" style="width:100%;height:100%;object-fit:cover"/>` : initials.toUpperCase()}</div></div>
  <div class="ic">
    <div class="nm">${learner.lastName}, ${learner.firstName}${learner.suffix ? " " + learner.suffix : ""}</div>
    ${learner.middleName ? `<div class="nm2">${learner.middleName}</div>` : ""}
    <div class="ib"><div class="il">Grade &amp; Section</div><div class="iv">${learner.gradeLevel ?? "--"} - ${learner.sectionName ?? "--"}</div></div>
    <div class="ib"><div class="il">LRN</div><div class="iv" style="font-family:monospace;letter-spacing:.15em">${learner.lrn}</div></div>
    <div class="ib"><div class="il">School Year</div><div class="iv">${schoolYear}</div></div>
  </div>
  <div class="ft">DepEd - Region XIII - Division of Butuan City</div>
</div>
<div class="card back">
  <div class="bh">Personal Information</div>
  <div class="rows">
    <div class="row"><span class="rl">Full Name</span><span class="rv">${fullName}</span></div>
    <div class="row"><span class="rl">Date of Birth</span><span class="rv">${birthdate}</span></div>
    <div class="row"><span class="rl">Sex</span><span class="rv">${learner.sex ? "Male" : "Female"}</span></div>
    <div class="row"><span class="rl">LRN</span><span class="rv" style="font-family:monospace">${learner.lrn}</span></div>
    <div class="row"><span class="rl">Grade Level</span><span class="rv">${learner.gradeLevel ?? "--"}</span></div>
    <div class="row"><span class="rl">Section</span><span class="rv">${learner.sectionName ?? "--"}</span></div>
  </div>
  <div class="sig">
    <div class="sl"></div>
    <div class="sr">
      <div class="sn2"><div class="sl2"></div>Student Signature</div>
      <div class="sn2"><div class="sl2"></div>Principal / Adviser</div>
    </div>
  </div>
  <div class="fb">
    <div class="fb1">If found, please return to:</div>
    <div class="fb2">Agusan National High School</div>
    <div class="fb3">Butuan City, Agusan del Norte</div>
  </div>
</div>
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body></html>`;
}

export default function IdCardPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [search, setSearch] = useState("");
  const [gradeId, setGradeId] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Learner | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const limit = 20;
  const schoolYear = "SY 2025-2026";

  const fetchLearners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
        ...(gradeId !== "all" ? { gradeId } : {}),
      });
      const res = await fetch(`/api/admin/id-card?${params}`);
      const json = await res.json();
      setLearners(json.data ?? []);
      setTotal(json.total ?? 0);
      if (json.grades?.length) setGrades(json.grades);
    } finally {
      setLoading(false);
    }
  }, [search, gradeId, page]);

  useEffect(() => { fetchLearners(); }, [fetchLearners]);

  const openPreview = (learner: Learner) => {
    setSelected(learner);
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    if (!selected) return;
    const w = window.open("", "_blank", "width=620,height=820");
    if (!w) return;
    w.document.write(buildPrintHtml(selected, schoolYear));
    w.document.close();
  };

  const totalPages = Math.ceil(total / limit);
  const selectedIdx = selected ? learners.findIndex(l => l.id === selected.id) : -1;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IdCard className="h-6 w-6 text-indigo-600" />
            ID Card Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Preview and print student ID cards &middot; {total.toLocaleString()} enrolled learners
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or LRN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <Select value={gradeId} onValueChange={(v) => { setGradeId(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : learners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <User className="h-12 w-12 opacity-30" />
          <p>No enrolled learners found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {learners.map((learner) => {
            const initials = (learner.firstName?.[0] ?? "") + (learner.lastName?.[0] ?? "");
            return (
              <div
                key={learner.id}
                className="group relative bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-indigo-300"
                onClick={() => openPreview(learner)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 overflow-hidden">
                    {learner.imgPath
                      ? <img src={learner.imgPath} alt="" className="w-full h-full object-cover" />
                      : initials.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{learner.lastName}, {learner.firstName}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{learner.lrn}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {learner.gradeLevel && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">{learner.gradeLevel}</Badge>
                  )}
                  {learner.sectionName && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">{learner.sectionName}</Badge>
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-indigo-600/90 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-semibold flex items-center gap-2">
                    <IdCard className="h-4 w-4" /> Preview ID
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {((page - 1) * limit) + 1}&ndash;{Math.min(page * limit, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="!max-w-[680px] w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <IdCard className="h-5 w-5 text-indigo-600" />
              ID Card Preview
              {selected && (
                <span className="text-muted-foreground font-normal">
                  &mdash; {selected.lastName}, {selected.firstName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Front</p>
                  <IdCardFront learner={selected} schoolYear={schoolYear} />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Back</p>
                  <IdCardBack learner={selected} />
                </div>
              </div>
              <div className="flex gap-3 w-full justify-center flex-wrap">
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => { if (selectedIdx > 0) setSelected(learners[selectedIdx - 1]); }}
                  disabled={selectedIdx <= 0}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Print ID Card
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => { if (selectedIdx < learners.length - 1) setSelected(learners[selectedIdx + 1]); }}
                  disabled={selectedIdx >= learners.length - 1}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
