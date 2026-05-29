"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Plus, Search, Pencil, Loader2, CheckCircle2, XCircle, Link2,
} from "lucide-react";

interface Subject {
  id: number;
  description: string;
  abbr: string | null;
  isActive: boolean;
  parentPartyId: number | null;
  parentDescription: string | null;
  orderBy: number | null;
  groupBy: number | null;
  gradeLinksCount: number;
}

type StatusFilter = "all" | "active" | "inactive";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ description: "", abbr: "", orderBy: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/admin/subjects?search=${encodeURIComponent(search)}&status=${status}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setSubjects(json.data || []);
        setTotal(json.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ description: "", abbr: "", orderBy: 1 });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setForm({
      description: s.description,
      abbr: s.abbr || "",
      orderBy: s.orderBy ?? 1,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editing
        ? `/api/admin/subjects/${editing.id}`
        : "/api/admin/subjects";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description.trim(),
          abbr: form.abbr.trim(),
          orderBy: form.orderBy,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save");
        return;
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Subject) {
    try {
      const res = await fetch(`/api/admin/subjects/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (res.ok) {
        setSubjects((prev) =>
          prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x))
        );
      }
    } catch {/* noop */}
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activeCount = subjects.filter((s) => s.isActive).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Subjects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage subject catalog used across all grade levels &amp; sections.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-1" /> Add Subject
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Showing</p>
            <p className="text-2xl font-bold">{subjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active (page)</p>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inactive (page)</p>
            <p className="text-2xl font-bold text-rose-600">{subjects.length - activeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by description or abbreviation…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px]">Abbr</TableHead>
                  <TableHead className="w-[120px]">Parent</TableHead>
                  <TableHead className="w-[100px] text-center">Grade Links</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-indigo-600" />
                      Loading subjects…
                    </TableCell>
                  </TableRow>
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No subjects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((s, i) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">
                        {(page - 1) * limit + i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{s.description}</TableCell>
                      <TableCell>
                        {s.abbr ? (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {s.abbr}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.parentDescription || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.gradeLinksCount > 0 ? (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Link2 className="h-3 w-3" /> {s.gradeLinksCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActive(s)}
                          className={
                            s.isActive
                              ? "inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded text-xs font-medium transition"
                              : "inline-flex items-center gap-1 text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded text-xs font-medium transition"
                          }
                        >
                          {s.isActive ? (
                            <><CheckCircle2 className="h-3 w-3" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3" /> Inactive</>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(s)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update subject information. Linked grade levels and sections will not be affected."
                : "Add a new subject to the global catalog."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="desc">Description *</Label>
              <Input
                id="desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Mathematics"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="abbr">Abbreviation</Label>
                <Input
                  id="abbr"
                  value={form.abbr}
                  onChange={(e) => setForm({ ...form, abbr: e.target.value })}
                  placeholder="e.g. MATH"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  min={1}
                  value={form.orderBy}
                  onChange={(e) => setForm({ ...form, orderBy: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
