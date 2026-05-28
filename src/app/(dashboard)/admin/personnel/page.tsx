"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const R2_PUBLIC_URL = "https://pub-750611bb5be64b558b7cd6db734b9c32.r2.dev";

interface Personnel {
  id: number;
  employee_id: string;
  basic_info_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  birthdate: string | null;
  sex: boolean;
  img_path: string | null;
  employee_type: string | null;
  personal_title: string | null;
  employment_status: string | null;
  department_name: string | null;
  is_active: number;
  employee_type_id: number | null;
  personal_title_id: number | null;
  status_id: number | null;
  school_department_id: number | null;
}

interface Lookup {
  id: number;
  description: string;
}

interface DeptLookup {
  id: number;
  department_name: string;
  abbr: string | null;
}

const EMPTY_FORM = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  birthdate: "",
  sex: "true",
  employeeId: "",
  employeeTypeId: "",
  personalTitleId: "",
  statusId: "",
  schoolDepartmentId: "none",
  isActive: true,
  basicInfoId: null as number | null,
};

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState<string | null>(null);

  // Lookups
  const [employeeTypes, setEmployeeTypes] = useState<Lookup[]>([]);
  const [personalTitles, setPersonalTitles] = useState<Lookup[]>([]);
  const [employmentStatuses, setEmploymentStatuses] = useState<Lookup[]>([]);
  const [departments, setDepartments] = useState<DeptLookup[]>([]);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        search,
      });
      const res = await fetch(`/api/admin/personnel?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPersonnel(data.data);
      setTotal(data.total);
    } catch {
      setError("Failed to load personnel. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchLookups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/personnel/lookups");
      if (!res.ok) return;
      const data = await res.json();
      setEmployeeTypes(data.employeeTypes);
      setPersonalTitles(data.personalTitles);
      setEmploymentStatuses(data.employmentStatuses);
      setDepartments(data.departments);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Personnel) => {
    setEditId(p.id);
    setForm({
      firstName: p.first_name,
      middleName: p.middle_name || "",
      lastName: p.last_name,
      suffix: p.suffix || "",
      birthdate: p.birthdate ? p.birthdate.split("T")[0] : "",
      sex: p.sex ? "true" : "false",
      employeeId: p.employee_id,
      employeeTypeId: p.employee_type_id ? String(p.employee_type_id) : "",
      personalTitleId: p.personal_title_id ? String(p.personal_title_id) : "",
      statusId: p.status_id ? String(p.status_id) : "",
      schoolDepartmentId: p.school_department_id ? String(p.school_department_id) : "none",
      isActive: p.is_active === 1,
      basicInfoId: p.basic_info_id,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.firstName || !form.lastName || !form.employeeId || !form.personalTitleId || !form.statusId) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        middleName: form.middleName || null,
        lastName: form.lastName,
        suffix: form.suffix || null,
        birthdate: form.birthdate || null,
        sex: form.sex === "true",
        employeeId: form.employeeId,
        employeeTypeId: form.employeeTypeId ? Number(form.employeeTypeId) : null,
        personalTitleId: Number(form.personalTitleId),
        statusId: Number(form.statusId),
        schoolDepartmentId: (form.schoolDepartmentId && form.schoolDepartmentId !== "none") ? Number(form.schoolDepartmentId) : null,
        isActive: form.isActive,
        basicInfoId: form.basicInfoId,
      };

      const url = editId ? `/api/admin/personnel/${editId}` : "/api/admin/personnel";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      setModalOpen(false);
      fetchPersonnel();
    } catch (err: any) {
      setFormError(err.message || "Failed to save personnel.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (p: Personnel) => {
    if (!confirm(`${p.is_active ? "Deactivate" : "Reactivate"} ${p.first_name} ${p.last_name}?`)) return;

    try {
      if (p.is_active) {
        await fetch(`/api/admin/personnel/${p.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/personnel/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...p, isActive: true, basicInfoId: p.basic_info_id, firstName: p.first_name, lastName: p.last_name, employeeId: p.employee_id, personalTitleId: p.personal_title_id, statusId: p.status_id }),
        });
      }
      fetchPersonnel();
    } catch {}
  };

  const getInitials = (p: Personnel) =>
    `${p.first_name?.[0] || ""}${p.last_name?.[0] || ""}`.toUpperCase();

  const getAvatarUrl = (imgPath: string | null) =>
    imgPath ? `${R2_PUBLIC_URL}/${imgPath}` : undefined;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personnel</h1>
            <p className="text-sm text-muted-foreground">
              {total} total records · Agusan National High School
            </p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Personnel
        </Button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchInput && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-800"
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500">{error}</div>
        ) : personnel.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <Users className="h-10 w-10 opacity-30" />
            <p>No personnel found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Title / Position</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personnel.map((p, i) => (
                <TableRow key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                  <TableCell className="text-muted-foreground text-xs">
                    {(page - 1) * LIMIT + i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarUrl(p.img_path)} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                          {getInitials(p)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {p.last_name}, {p.first_name}{p.middle_name ? ` ${p.middle_name[0]}.` : ""}
                          {p.suffix ? ` ${p.suffix}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.sex ? "Male" : "Female"}
                          {p.birthdate ? ` · Born ${new Date(p.birthdate).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}` : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {p.employee_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{p.personal_title || "—"}</span>
                  </TableCell>
                  <TableCell>
                    {p.employee_type ? (
                      <Badge
                        variant="secondary"
                        className={
                          p.employee_type === "TEACHING"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {p.employee_type}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{p.employment_status || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={p.is_active ? "default" : "secondary"}
                      className={
                        p.is_active
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500"
                      }
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => openEdit(p)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-8 w-8 p-0 ${p.is_active ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-green-50 hover:text-green-600"}`}
                        onClick={() => handleDeactivate(p)}
                        title={p.is_active ? "Deactivate" : "Reactivate"}
                      >
                        {p.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
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
          <span>
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium text-gray-700">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <Users className="h-5 w-5" />
              {editId ? "Edit Personnel" : "Add New Personnel"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-2">
            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="DELA CRUZ"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="JUAN"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="SANTOS"
                    value={form.middleName}
                    onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    placeholder="JR., SR., III..."
                    value={form.suffix}
                    onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthdate">Birthdate</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={form.birthdate}
                    onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sex</Label>
                  <Select
                    value={form.sex}
                    onValueChange={(v) => setForm({ ...form, sex: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Male</SelectItem>
                      <SelectItem value="false">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Employment Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Employment Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId">
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employeeId"
                    placeholder="e.g. 1001234"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Employee Type</Label>
                  <Select
                    value={form.employeeTypeId}
                    onValueChange={(v) => setForm({ ...form, employeeTypeId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeTypes.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>
                    Position / Title <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.personalTitleId}
                    onValueChange={(v) => setForm({ ...form, personalTitleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position..." />
                    </SelectTrigger>
                    <SelectContent>
                      {personalTitles.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Employment Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.statusId}
                    onValueChange={(v) => setForm({ ...form, statusId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentStatuses.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select
                    value={form.schoolDepartmentId}
                    onValueChange={(v) => setForm({ ...form, schoolDepartmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Department —</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.department_name}
                          {d.abbr ? ` (${d.abbr})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editId && (
                  <div className="space-y-1.5">
                    <Label>Active Status</Label>
                    <Select
                      value={form.isActive ? "true" : "false"}
                      onValueChange={(v) => setForm({ ...form, isActive: v === "true" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editId ? "Save Changes" : "Add Personnel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
