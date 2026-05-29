"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, AlertCircle } from "lucide-react";

interface PickerOption {
  id: number;
  description: string;
  abbr?: string | null;
  levelKind?: string;
  partyTypeId?: number;
  label?: string;
}

interface Pickers {
  gradeLevels: PickerOption[];
  schedules: PickerOption[];
  strands: PickerOption[];
  rooms: PickerOption[];
}

interface AddSectionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (newId: number) => void;
}

export function AddSectionModal({ open, onClose, onCreated }: AddSectionModalProps) {
  const [pickers, setPickers] = useState<Pickers | null>(null);
  const [pickersLoading, setPickersLoading] = useState(true);
  const [form, setForm] = useState({
    sectionName: "",
    gradeLevelId: "",
    scheduleId: "",
    roomId: "",
    programStrandId: "",
    program: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load pickers when modal opens
  useEffect(() => {
    if (!open) return;
    setPickersLoading(true);
    setError(null);
    fetch("/api/school/sections/pickers")
      .then((r) => r.json())
      .then((d) => setPickers(d))
      .catch(() => setError("Failed to load form options"))
      .finally(() => setPickersLoading(false));
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setForm({ sectionName: "", gradeLevelId: "", scheduleId: "", roomId: "", programStrandId: "", program: "" });
      setError(null);
    }
  }, [open]);

  const isSHS = (() => {
    if (!pickers || !form.gradeLevelId) return false;
    const g = pickers.gradeLevels.find((x) => String(x.id) === form.gradeLevelId);
    return g?.partyTypeId === 15;
  })();

  async function handleSubmit() {
    if (!form.sectionName.trim()) { setError("Section name is required"); return; }
    if (!form.gradeLevelId) { setError("Grade level is required"); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/school/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionName: form.sectionName.trim(),
          gradeLevelId: Number(form.gradeLevelId),
          scheduleId: form.scheduleId ? Number(form.scheduleId) : null,
          roomId: form.roomId ? Number(form.roomId) : null,
          programStrandId: form.programStrandId ? Number(form.programStrandId) : null,
          program: form.program.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create section");
        return;
      }
      onCreated(json.id);
    } finally {
      setSaving(false);
    }
  }

  // Group grade levels by JHS vs SHS for nicer dropdown
  const jhsGrades = pickers?.gradeLevels.filter((g) => g.partyTypeId === 14) || [];
  const shsGrades = pickers?.gradeLevels.filter((g) => g.partyTypeId === 15) || [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-600" />
            Add New Section
          </DialogTitle>
          <DialogDescription>
            Create a new section in the currently active school year.
          </DialogDescription>
        </DialogHeader>

        {pickersLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-indigo-600" />
            Loading form options…
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sectionName">Section Name *</Label>
                <Input
                  id="sectionName"
                  value={form.sectionName}
                  onChange={(e) => setForm({ ...form, sectionName: e.target.value })}
                  placeholder="e.g. NEWTON, RIZAL"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Grade Level *</Label>
                <Select value={form.gradeLevelId} onValueChange={(v) => setForm({ ...form, gradeLevelId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {jhsGrades.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Junior High</div>
                        {jhsGrades.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>Grade {g.description}</SelectItem>
                        ))}
                      </>
                    )}
                    {shsGrades.length > 0 && (
                      <>
                        <div className="px-2 py-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Senior High</div>
                        {shsGrades.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>Grade {g.description}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={form.scheduleId} onValueChange={(v) => setForm({ ...form, scheduleId: v })}>
                  <SelectTrigger><SelectValue placeholder="(optional)" /></SelectTrigger>
                  <SelectContent>
                    {pickers?.schedules.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })}>
                  <SelectTrigger><SelectValue placeholder="(optional)" /></SelectTrigger>
                  <SelectContent>
                    {pickers?.rooms.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.label || r.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Strand only relevant for SHS */}
            {(isSHS || form.gradeLevelId === "") && (
              <div className="space-y-2">
                <Label>Program / Strand {isSHS && <span className="text-xs text-muted-foreground">(for Senior High)</span>}</Label>
                <Select value={form.programStrandId} onValueChange={(v) => setForm({ ...form, programStrandId: v })}>
                  <SelectTrigger><SelectValue placeholder="(optional)" /></SelectTrigger>
                  <SelectContent>
                    {pickers?.strands.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.description}
                        {s.abbr && <span className="text-muted-foreground ml-1">({s.abbr})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || pickersLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Create Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
