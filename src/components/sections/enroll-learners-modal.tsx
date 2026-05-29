"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search, Loader2, UserPlus, AlertCircle, CheckCircle2, UserX,
} from "lucide-react";

interface EligibleLearner {
  learnerId: number;
  lrn: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  birthdate: string | null;
  sex: boolean;
  imgPath: string | null;
}

interface EnrollLearnersModalProps {
  open: boolean;
  onClose: () => void;
  sectionId: number;
  sectionName: string;
  gradeLabel: string;
  onEnrolled: () => void;
}

export function EnrollLearnersModal({ open, onClose, sectionId, sectionName, gradeLabel, onEnrolled }: EnrollLearnersModalProps) {
  const [learners, setLearners] = useState<EligibleLearner[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ enrolled: number; skipped: number } | null>(null);

  const load = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const url = `/api/school/sections/${sectionId}/eligible-learners?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setLearners(json.data || []);
        setTotal(json.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [sectionId, search, page]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, open]);

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setSearch("");
      setPage(1);
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      learners.forEach((l) => next.add(l.learnerId));
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }

  async function enroll() {
    if (selected.size === 0) return;
    setEnrolling(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/school/sections/${sectionId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerIds: Array.from(selected) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to enroll");
        return;
      }
      setSuccess({ enrolled: json.enrolled, skipped: json.skipped });
      setSelected(new Set());
      // Reload eligible list (some just got removed)
      await load();
      onEnrolled();
    } finally {
      setEnrolling(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function initials(f: string, l: string) {
    return ((f?.[0] ?? "") + (l?.[0] ?? "")).toUpperCase() || "?";
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="!max-w-[760px] w-[92vw] max-h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            Enroll Learners — {sectionName}
          </DialogTitle>
          <DialogDescription>
            <span className="text-xs">{gradeLabel} · Showing learners not yet enrolled in any section this SY</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-3 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or LRN…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-9 text-sm bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px]">
              {total.toLocaleString()} available
            </Badge>
            {selected.size > 0 && (
              <Badge className="bg-indigo-600 text-[10px]">
                {selected.size} selected
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-indigo-600" /> Loading learners…
            </div>
          ) : learners.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <UserX className="h-10 w-10 opacity-30" />
              <p className="text-sm">No eligible learners found{search ? " matching your search" : ""}.</p>
              {!search && <p className="text-xs">All learners may already be enrolled.</p>}
            </div>
          ) : (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2 px-2">
                <button onClick={selectAllOnPage} className="hover:underline text-indigo-600">
                  Select all on this page
                </button>
                {selected.size > 0 && (
                  <button onClick={clearSelection} className="hover:underline">
                    Clear selection
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {learners.map((l, i) => {
                  const checked = selected.has(l.learnerId);
                  return (
                    <button
                      key={l.learnerId}
                      onClick={() => toggle(l.learnerId)}
                      className={
                        "w-full text-left flex items-center gap-3 px-3 py-2 rounded-md border transition " +
                        (checked
                          ? "bg-indigo-50 border-indigo-200"
                          : "border-transparent hover:bg-muted/50")
                      }
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <span className="text-xs text-muted-foreground w-6">{(page - 1) * limit + i + 1}</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={l.sex ? "bg-blue-100 text-blue-700 text-[10px] font-bold" : "bg-pink-100 text-pink-700 text-[10px] font-bold"}>
                          {initials(l.firstName, l.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {l.lastName}, {l.firstName} {l.middleName ? l.middleName[0] + "." : ""}{l.suffix ? " " + l.suffix : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">{l.lrn || "—"}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {l.sex ? "M" : "F"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {error && (
            <div className="rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-1.5 flex items-center gap-2 flex-1">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 flex items-center gap-2 flex-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Enrolled <strong>{success.enrolled}</strong>
              {success.skipped > 0 && <> · Skipped <strong>{success.skipped}</strong> (already enrolled)</>}
            </div>
          )}
          {!error && !success && (
            <div className="text-xs text-muted-foreground flex-1">
              {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
            </div>
          )}
          <div className="flex gap-2">
            {totalPages > 1 && (
              <>
                <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </>
            )}
            <Button variant="outline" onClick={onClose} disabled={enrolling}>Close</Button>
            <Button onClick={enroll} disabled={enrolling || selected.size === 0} className="bg-indigo-600 hover:bg-indigo-700">
              {enrolling && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Enroll {selected.size > 0 && `(${selected.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
