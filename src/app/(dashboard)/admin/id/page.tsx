"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Printer, IdCard, Users, Loader2, CheckSquare, Square, Eye, X } from "lucide-react";

interface Section {
  id: number; sctn_nm: string; grade_level: string; grade_level_id: number;
  grade_order: number; advisory_teacher: string | null; learner_count: number;
}
interface Learner {
  id: number; lrn: string; basicInfoId: number;
  firstName: string; middleName: string | null; lastName: string; suffix: string | null;
  birthdate: string | null; sex: boolean; imgPath: string | null;
  sectionName: string | null; gradeLevel: string | null; advisoryTeacher: string | null;
  strand: string | null; guardian: string | null; contactNum: string | null;
  barangayName: string | null; cityMunName: string | null;
  gradeLevelId: number | null; gradeLevelK: string | null;
  fullName?: string | null; lastFullname?: string | null; addressDetails?: string | null;
}

// Card dimensions — portrait CR80-ish
const CW = 240;
const CH = Math.round(CW * 530 / 360); // 353px

// Legacy color palette (exact hex codes from CI3 source)
const C_DARKBLUE = "#102C3D";  // ACABADO, DANIEL ANDY T., LRN
const C_CYAN     = "#41A1DF";  // Birthdate/Grade&Section/Program/Adviser LABEL (from legacy)
const C_GREEN    = "forestgreen"; // Grade&Section + Program/Strand VALUE (from legacy)
const C_INDIGO   = "#240AA2";  // S.Y. label color (from legacy)
const C_INDIGO2  = "#1E34AB";  // PARENT/GUARDIAN, JHS/SHS subtitle
const FONT_M     = "'Montserrat', Arial, sans-serif";
const FONT_LG    = "'League Gothic', 'Montserrat', Arial, sans-serif";

function extractGradeNum(g: string | null): string {
  if (!g) return "";
  const m = g.match(/\d+/);
  return m ? m[0] : g;
}

// ============================================================================
// PRINT HTML — A4 portrait
// ============================================================================
function buildPrintHtml(learners: Learner[]): string {
  // Working layout: 354x518 card with absolute-positioned elements over bg <img>
  const CARD_W = 354;
  const CARD_H = 518;

  const cards = learners.map((l) => {
    const bd = l.birthdate ? new Date(l.birthdate).toLocaleDateString("en-PH", { month: "long", day: "2-digit", year: "numeric" }) : "--";
    const guardian = (l.guardian ?? "").toUpperCase();
    const contact = (l.contactNum ?? "").toUpperCase();
    const rawAddrP = l.addressDetails
      ? l.addressDetails.toUpperCase().trim().replace(/\s+/g, " ")
      : [l.barangayName, l.cityMunName].filter(Boolean).join(", ").toUpperCase() || "--";
    const addr = rawAddrP.replace(/\s*\(CAPITAL\)\s*/i, "").trim();
    const lastName = l.lastName.toUpperCase();
    const mi = l.middleName ? " " + l.middleName[0].toUpperCase() + "." : "";
    const firstMi = (l.firstName + mi + (l.suffix ? " " + l.suffix : "")).toUpperCase();
    const gNum = extractGradeNum(l.gradeLevel);
    const gradeSubtitle = l.gradeLevelK ?? "";
    const gs = gNum && l.sectionName ? `${gNum} - ${l.sectionName.toUpperCase()}` : (l.gradeLevel ?? "--");
    const strand = l.strand ?? "--";
    const adv = (l.advisoryTeacher ?? "--").toUpperCase();
    const photo = l.imgPath
      ? `<img src="${l.imgPath}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='/anhs-logo.png';this.style.objectFit='contain';this.style.padding='6px';this.style.opacity='0.35';" />`
      : `<img src="/anhs-logo.png" style="width:100%;height:100%;object-fit:contain;padding:6px;opacity:0.35;display:block;" />`;

    return `
<div class="pair">
  <!-- FRONT -->
  <div class="card">
    <img src="/id-front.png" class="bg" />
    <!-- Photo: lower (top 17%) and bigger (44%w 28%h) -->
    <div style="position:absolute;left:4%;top:17%;width:44%;height:28%;overflow:hidden;border:1.5px solid #1E34AB;border-radius:3px;background:#eef2ff;z-index:2;">${photo}</div>
    <!-- S.Y. (VALIDATION text is on bg image — sits at ~17%, so we go BELOW it at 20%) -->
    <div style="position:absolute;right:4%;top:20%;width:42%;text-align:center;font-family:Montserrat,sans-serif;font-weight:700;font-size:11px;color:${C_INDIGO};line-height:1;z-index:2;">S.Y. 2024-2025</div>
    <!-- QR front: positioned BELOW S.Y. (24%) so it doesn't overlap with VALIDATION -->
    <div style="position:absolute;right:8%;top:24%;width:36%;height:22%;background:#fff;display:flex;align-items:center;justify-content:center;z-index:2;overflow:hidden;"><div id="pqf_${l.id}" style="width:100%;height:100%;line-height:0;"></div></div>
    <!-- LRN BELOW QR -->
    <div style="position:absolute;right:4%;top:47%;width:42%;text-align:center;font-family:Montserrat,sans-serif;font-weight:800;font-size:11px;color:${C_DARKBLUE};letter-spacing:0.5px;z-index:2;line-height:1;">${l.lrn}</div>
    <!-- JHS/SHS -->
    <div style="position:absolute;right:4%;top:49.5%;width:42%;text-align:center;font-family:Montserrat,sans-serif;font-weight:800;font-size:9px;color:#1E40D6;letter-spacing:0.3px;z-index:2;line-height:1;">${gradeSubtitle}</div>
    <!-- Last name -->
    <div style="position:absolute;left:5%;top:34%;width:90%;text-align:left;font-family:Montserrat,sans-serif;font-weight:800;font-size:25px;color:${C_DARKBLUE};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1;letter-spacing:0.5px;z-index:2;">${lastName}</div>
    <!-- First name -->
    <div style="position:absolute;left:5%;top:40.5%;width:90%;text-align:left;font-family:Montserrat,sans-serif;font-weight:600;font-size:17px;color:${C_DARKBLUE};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1;z-index:2;">${firstMi}</div>
    <!-- Info rows TABLE — UP more so Adviser clears bg ANHS logo at bottom -->
    <div style="position:absolute;left:5%;top:45%;width:90%;font-family:'League Gothic','Montserrat',sans-serif;font-size:14px;line-height:1;text-align:left;z-index:2;">
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
        <tr><td style="color:${C_CYAN};font-weight:300;padding:0 6px 1px 0;white-space:nowrap;line-height:1;">Birthdate:</td><td style="color:#000;font-weight:300;padding:0 0 1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1;">${bd}</td></tr>
        <tr><td style="color:${C_CYAN};font-weight:300;padding:0 6px 1px 0;white-space:nowrap;line-height:1;">Grade &amp; Section:</td><td style="color:${C_GREEN};font-weight:300;padding:0 0 1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1;">${gs}</td></tr>
        <tr><td style="color:${C_CYAN};font-weight:300;padding:0 6px 1px 0;white-space:nowrap;line-height:1;">Program/Strand:</td><td style="color:${C_GREEN};font-weight:300;padding:0 0 1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1;">${strand}</td></tr>
        <tr><td style="color:${C_CYAN};font-weight:300;padding:0 6px 0 0;white-space:nowrap;line-height:1;">Adviser:</td><td style="color:#000;font-weight:300;padding:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1;">${adv}</td></tr>
      </table>
    </div>
  </div>
  <!-- BACK -->
  <div class="card">
    <img src="/id-back.png" class="bg" />
    <!-- QR back: clears DEPARTMENT OF EDUCATION header, slightly up -->
    <div style="position:absolute;top:16%;left:50%;transform:translateX(-50%);width:120px;height:120px;background:#fff;display:flex;align-items:center;justify-content:center;z-index:2;overflow:hidden;"><div id="pqb_${l.id}" style="width:100%;height:100%;line-height:0;"></div></div>
    <!-- Guardian block — INSIDE purple highlight box (57-72% area) -->
    <div style="position:absolute;top:57%;left:50%;transform:translateX(-50%);text-align:center;width:84%;z-index:2;">
      <div style="font-family:Montserrat,sans-serif;font-weight:800;font-size:14px;color:#000;letter-spacing:0.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1;">${guardian || "--"}</div>
      <div style="font-family:'League Gothic',sans-serif;font-weight:300;font-size:11px;color:${C_INDIGO2};margin-top:1px;letter-spacing:0.5px;line-height:1;">PARENT/GUARDIAN</div>
      <div style="font-family:'League Gothic',sans-serif;font-weight:300;font-size:12px;color:#000;margin-top:1px;line-height:1;">${contact || "--"}</div>
      <div style="font-family:'League Gothic',sans-serif;font-weight:300;font-size:11px;color:#000;margin-top:1px;line-height:1.1;">${addr}</div>
    </div>
  </div>
</div>`;
  }).join("\n");

  const qrInits = learners.map((l) =>
    `(function(){var f=document.getElementById("pqf_${l.id}");if(f){f.innerHTML="";new QRCode(f,{text:"7${l.lrn}",width:200,height:200,correctLevel:QRCode.CorrectLevel.M});}var b=document.getElementById("pqb_${l.id}");if(b){b.innerHTML="";new QRCode(b,{text:"6${l.lrn}",width:200,height:200,correctLevel:QRCode.CorrectLevel.M});}})();`
  ).join("\n");

  return `<!DOCTYPE html><html><head>
<title>Student ID Cards</title>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700;800;900&family=League+Gothic&display=swap" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<style>
@page { size: A4 portrait; margin: 5mm; }
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:white;font-family:'Source Sans Pro','Montserrat',Arial,sans-serif;}
body{padding:5mm;}
.pair{display:flex;gap:8mm;page-break-inside:avoid;margin-bottom:8mm;}
.card{position:relative;width:${CARD_W}px;height:${CARD_H}px;overflow:hidden;border-radius:6px;flex-shrink:0;background:#fff;outline:1.5px dashed #888;outline-offset:3px;}
.card .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:1;display:block;}
/* QR canvas/img force-fill */
[id^="pqf_"] canvas, [id^="pqf_"] img,
[id^="pqb_"] canvas, [id^="pqb_"] img { width:100% !important; height:100% !important; display:block; }
@media print{
  body{margin:0;padding:0;}
  .pair{break-inside:avoid;}
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }
}
<\/style>
</head>
<body>${cards}
<script>
window.onload=function(){
  ${qrInits}
  setTimeout(function(){window.print();},700);
};
<\/script>
</body></html>`;
}





// ============================================================================
// PREVIEW: FRONT CARD
// ============================================================================
function IdCardFront({ l, idPrefix }: { l: Learner; idPrefix: string }) {
  const lastName = l.lastName.toUpperCase();
  const mi = l.middleName ? " " + l.middleName[0].toUpperCase() + "." : "";
  const firstMi = (l.firstName + mi + (l.suffix ? " " + l.suffix : "")).toUpperCase();
  const gNum = extractGradeNum(l.gradeLevel);
  const gradeSubtitle = l.gradeLevelK ?? "";
  const bd = l.birthdate ? new Date(l.birthdate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "--";
  const gs = gNum && l.sectionName ? `${gNum} - ${l.sectionName.toUpperCase()}` : (l.gradeLevel ?? "--");
  const strand = l.strand ?? "--";
  const adv = (l.advisoryTeacher ?? "--").toUpperCase();

  return (
    <div style={{ position: "relative", width: CW, height: CH, borderRadius: 6, overflow: "hidden", boxShadow: "0 0 0 1px #ccc", flexShrink: 0 }}>
      <img src="/id-front.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />

      {/* Photo — LEFT, LOWER and BIGGER to match legacy */}
      <div style={{ position: "absolute", left: "5%", top: "19%", width: "42%", height: "33%", overflow: "hidden", border: "1.5px solid #1E34AB", borderRadius: 2, background: "#eef2ff" }}>
        {l.imgPath
          ? <img src={l.imgPath} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { const t = e.target as HTMLImageElement; t.src = "/anhs-logo.png"; t.style.objectFit = "contain"; t.style.padding = "4px"; t.style.opacity = "0.35"; }} />
          : <img src="/anhs-logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, opacity: 0.35 }} />}
      </div>

      {/* S.Y. only — VALIDATION: text already on bg image */}
      <div style={{ position: "absolute", right: "5%", top: "22%", width: "42%", textAlign: "center", fontFamily: FONT_M, fontWeight: 700, fontSize: 9, color: C_INDIGO, lineHeight: 1 }}>S.Y. 2024-2025</div>

      {/* QR — fills white container; canvas/img force-sized via class */}
      <div
        className="qr-fill"
        style={{ position: "absolute", right: "8%", top: "25%", width: "36%", height: "23%", background: "#fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div id={`${idPrefix}_${l.id}`} style={{ width: "100%", height: "100%", lineHeight: 0 }} />
      </div>

      {/* LRN under QR */}
      <div style={{ position: "absolute", right: "5%", top: "49%", width: "42%", textAlign: "center", fontFamily: FONT_M, fontWeight: 800, fontSize: 9, color: C_DARKBLUE, letterSpacing: "0.4px", lineHeight: 1 }}>{l.lrn}</div>
      {/* JUNIOR HIGH SCHOOL — bright blue */}
      <div style={{ position: "absolute", right: "5%", top: "51.5%", width: "42%", textAlign: "center", fontFamily: FONT_M, fontWeight: 800, fontSize: 7.5, color: "#1E40D6", letterSpacing: "0.02em", lineHeight: 1 }}>{gradeSubtitle}</div>

      {/* Last name BIG dark blue */}
      <div style={{ position: "absolute", left: "5%", top: "53%", width: "90%", textAlign: "left", fontFamily: FONT_M, fontWeight: 800, fontSize: 20, color: C_DARKBLUE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.0, letterSpacing: "0.5px" }}>{lastName}</div>

      {/* First name + MI */}
      <div style={{ position: "absolute", left: "5%", top: "59.5%", width: "90%", textAlign: "left", fontFamily: FONT_M, fontWeight: 500, fontSize: 12, color: C_DARKBLUE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.0 }}>{firstMi}</div>

      {/* Info rows — League Gothic, label cyan LEFT-aligned + value next to it */}
      <div style={{
        position: "absolute", left: "5%", top: "66%", width: "90%",
        fontFamily: FONT_LG, fontSize: 11.5, lineHeight: 1.1, textAlign: "left",
        display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 6, rowGap: 0,
      }}>
        <span style={{ color: C_CYAN, fontWeight: 400 }}>Birthdate:</span>
        <span style={{ color: "#000", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bd}</span>

        <span style={{ color: C_CYAN, fontWeight: 400 }}>Grade &amp; Section:</span>
        <span style={{ color: C_GREEN, fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{gs}</span>

        <span style={{ color: C_CYAN, fontWeight: 400 }}>Program/Strand:</span>
        <span style={{ color: C_GREEN, fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{strand}</span>

        <span style={{ color: C_CYAN, fontWeight: 400 }}>Adviser:</span>
        <span style={{ color: "#000", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adv}</span>
      </div>
    </div>
  );
}

// ============================================================================
// PREVIEW: BACK CARD
// ============================================================================
function IdCardBack({ l, idPrefix }: { l: Learner; idPrefix: string }) {
  const guardianName = l.guardian ? l.guardian.toUpperCase() : "";
  const contact = (l.contactNum ?? "").toUpperCase();
  // Clean address: strip "(CAPITAL)" suffix that legacy DB sometimes appends
  const rawAddr = l.addressDetails
    ? l.addressDetails.toUpperCase().trim().replace(/\s+/g, " ")
    : [l.barangayName, l.cityMunName].filter(Boolean).join(", ").toUpperCase() || "--";
  const addr = rawAddr.replace(/\s*\(CAPITAL\)\s*/i, "").trim();

  return (
    <div style={{ position: "relative", width: CW, height: CH, borderRadius: 6, overflow: "hidden", boxShadow: "0 0 0 1px #ccc", flexShrink: 0 }}>
      <img src="/id-back.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />

      {/* QR back — fills white container exactly, slightly up */}
      <div
        className="qr-fill"
        style={{ position: "absolute", top: "16%", left: "50%", transform: "translateX(-50%)", width: 92, height: 92, background: "#fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div id={`${idPrefix}_${l.id}`} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Guardian block — INSIDE purple highlight box (sits around 50-63% area) */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "82%" }}>
        <div style={{ fontFamily: FONT_M, fontWeight: 800, fontSize: 11, color: "#000", letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1 }}>
          {guardianName || "--"}
        </div>
        <div style={{ fontFamily: FONT_LG, fontWeight: 400, fontSize: 9, color: C_INDIGO2, marginTop: 1, letterSpacing: "0.04em", lineHeight: 1 }}>PARENT/GUARDIAN</div>
        <div style={{ fontFamily: FONT_LG, fontWeight: 400, fontSize: 9, color: "#000", marginTop: 1, lineHeight: 1 }}>{contact || "--"}</div>
        <div style={{ fontFamily: FONT_LG, fontWeight: 400, fontSize: 8.5, color: "#000", marginTop: 1, lineHeight: 1 }}>{addr}</div>
      </div>
    </div>
  );
}

// ============================================================================
// PREVIEW MODAL
// ============================================================================
function IdPreviewModal({ learners, onClose }: { learners: Learner[]; onClose: () => void }) {
  const qrInitDone = useRef(false);

  useEffect(() => {
    if (!learners.length || qrInitDone.current) return;
    const init = () => {
      qrInitDone.current = true;
      learners.forEach((l) => {
        const fEl = document.getElementById(`mqf_${l.id}`);
        const bEl = document.getElementById(`mqb_${l.id}`);
        if (fEl && !fEl.hasChildNodes()) {
          // Render at high res, CSS scales it to fill container
          new (window as any).QRCode(fEl, { text: `7${l.lrn}`, width: 200, height: 200, correctLevel: 1 });
        }
        if (bEl && !bEl.hasChildNodes()) {
          new (window as any).QRCode(bEl, { text: `6${l.lrn}`, width: 200, height: 200, correctLevel: 1 });
        }
      });
    };
    const load = () => {
      if ((window as any).QRCode) { init(); return; }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = init;
      document.head.appendChild(s);
    };
    const t = setTimeout(load, 80);
    return () => clearTimeout(t);
  }, [learners]);

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=2000,height=1500");
    if (!w) return;
    w.document.write(buildPrintHtml(learners));
    w.document.close();
    onClose(); // close modal after opening new tab
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      {/* Force QR canvas/img to fill its container */}
      <style>{`
        .qr-fill canvas, .qr-fill img { width: 100% !important; height: 100% !important; display: block; }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] w-full max-w-5xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="font-bold text-base">Student ID Preview</h2>
            <p className="text-xs text-muted-foreground">{learners.length} learner{learners.length !== 1 ? "s" : ""} selected &middot; Click below to open print preview in a new tab</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-xs rounded-lg gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-8">
          {learners.map((l) => (
            <div key={l.id} className="flex gap-5 justify-center items-start">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2 font-medium">FRONT</p>
                <IdCardFront l={l} idPrefix="mqf" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2 font-medium">BACK</p>
                <IdCardBack l={l} idPrefix="mqb" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function IdCardPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<{ id: number; label: string; order: number }[]>([]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch("/api/admin/id-sections").then(r => r.json()).then(d => {
      const secs: Section[] = d.data ?? [];
      setSections(secs);
      const seen = new Set<number>();
      const gl: { id: number; label: string; order: number }[] = [];
      secs.forEach(s => {
        if (!seen.has(s.grade_level_id)) { seen.add(s.grade_level_id); gl.push({ id: s.grade_level_id, label: s.grade_level, order: s.grade_order }); }
      });
      setGrades(gl.sort((a, b) => a.order - b.order));
    }).catch(console.error).finally(() => setLoadingSections(false));
  }, []);

  const loadLearners = useCallback(async (sectionId: number) => {
    setLoadingLearners(true); setSelected(new Set());
    try {
      const res = await fetch(`/api/admin/id-card?sectionId=${sectionId}&limit=200`);
      const json = await res.json();
      setLearners(json.data ?? []);
    } finally { setLoadingLearners(false); }
  }, []);

  const handleSectionClick = (sec: Section) => { setSelectedSection(sec); loadLearners(sec.id); setSearch(""); };
  const toggleLearner = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = learners.filter(l => !search || `${l.lastName} ${l.firstName} ${l.lrn}`.toLowerCase().includes(search.toLowerCase()));
  const allSel = filtered.length > 0 && filtered.every(l => selected.has(l.id));
  const toggleAll = () => {
    const ids = filtered.map(l => l.id);
    setSelected(prev => { const n = new Set(prev); allSel ? ids.forEach(id => n.delete(id)) : ids.forEach(id => n.add(id)); return n; });
  };

  const filteredSections = sections.filter(s => gradeFilter === "all" || s.grade_level_id === Number(gradeFilter));
  const selectedLearners = learners.filter(l => selected.has(l.id));

  return (
    <>
      {showPreview && selectedLearners.length > 0 && (
        <IdPreviewModal learners={selectedLearners} onClose={() => setShowPreview(false)} />
      )}

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <div className="w-72 shrink-0 border-r flex flex-col bg-gray-50/50">
          <div className="px-4 pt-5 pb-3 border-b">
            <h2 className="font-bold text-base flex items-center gap-2">
              <IdCard className="h-4 w-4 text-indigo-600" /> ID Card Generator
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select a section to load learners</p>
            <div className="mt-3">
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="All Grades" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {loadingSections
              ? <div className="flex justify-center pt-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
              : filteredSections.map(sec => (
                <button key={sec.id} onClick={() => handleSectionClick(sec)}
                  className={`w-full text-left px-4 py-2.5 border-b border-gray-100 transition-colors hover:bg-indigo-50 ${selectedSection?.id === sec.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{sec.sctn_nm}</span>
                    <Badge variant="secondary" className="text-[10px] rounded-full px-1.5">{sec.grade_level}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {sec.advisory_teacher ?? "No adviser"} &middot; {sec.learner_count} learners
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedSection
            ? <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Users className="h-14 w-14 opacity-20" />
                <p className="text-sm">Select a section from the left to view learners</p>
              </div>
            : <>
                <div className="px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-base">{selectedSection.sctn_nm}</h3>
                    <p className="text-xs text-muted-foreground">{selectedSection.grade_level} &middot; {selectedSection.advisory_teacher ?? "No adviser"} &middot; {learners.length} learners</p>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Search learner..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs w-44 rounded-lg" />
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1.5" onClick={toggleAll}>
                      {allSel ? <><CheckSquare className="h-3.5 w-3.5" /> Deselect all</> : <><Square className="h-3.5 w-3.5" /> Select all</>}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1.5" disabled={selected.size === 0} onClick={() => setShowPreview(true)}>
                      <Eye className="h-3.5 w-3.5" /> Preview {selected.size > 0 ? `(${selected.size})` : ""}
                    </Button>
                    <Button size="sm" className="h-8 text-xs rounded-lg gap-1.5 bg-indigo-600 hover:bg-indigo-700" disabled={selected.size === 0}
                      onClick={() => { const w = window.open("", "_blank", "width=2000,height=1500"); if (!w) return; w.document.write(buildPrintHtml(selectedLearners)); w.document.close(); }}>
                      <Printer className="h-3.5 w-3.5" /> Print {selected.size > 0 ? `(${selected.size})` : ""} IDs
                    </Button>
                  </div>
                </div>

                {loadingLearners
                  ? <div className="flex-1 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
                  : filtered.length === 0
                    ? <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No learners found</div>
                    : <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b sticky top-0 z-10">
                            <tr>
                              <th className="w-10 px-4 py-2.5"><Checkbox checked={allSel} onCheckedChange={toggleAll} className="rounded" /></th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">#</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Name</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">LRN</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Sex</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Birthdate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((l, idx) => {
                              const isSel = selected.has(l.id);
                              const bd = l.birthdate ? new Date(l.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "--";
                              return (
                                <tr key={l.id} onClick={() => toggleLearner(l.id)}
                                  className={`border-b cursor-pointer transition-colors hover:bg-indigo-50/60 ${isSel ? "bg-indigo-50" : ""}`}>
                                  <td className="px-4 py-2.5"><Checkbox checked={isSel} onCheckedChange={() => toggleLearner(l.id)} className="rounded" /></td>
                                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                        {l.imgPath
                                          ? <img src={l.imgPath} alt="" className="w-full h-full object-cover" onError={e => { const t = e.target as HTMLImageElement; t.src = "/anhs-logo.png"; t.style.opacity = "0.35"; t.style.padding = "4px"; }} />
                                          : <img src="/anhs-logo.png" alt="" className="w-full h-full object-contain p-1 opacity-30" />}
                                      </div>
                                      <span className="font-medium">{l.lastName}, {l.firstName}{l.middleName ? " " + l.middleName[0] + "." : ""}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{l.lrn}</td>
                                  <td className="px-3 py-2.5 text-xs">{l.sex ? "M" : "F"}</td>
                                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{bd}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>}
              </>}
        </div>
      </div>
    </>
  );
}
