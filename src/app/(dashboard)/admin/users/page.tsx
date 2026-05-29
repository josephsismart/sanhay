"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Shield, Search, KeyRound, UserPlus, Loader2, CheckCircle2, XCircle,
  ShieldAlert, Pencil, Users as UsersIcon, UserX, UserCheck, Eye, EyeOff,
} from "lucide-react";

const R2 = "https://pub-750611bb5be64b558b7cd6db734b9c32.r2.dev";

interface User {
  personnelId: number;
  basicInfoId: number;
  employeeId: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  imgPath: string | null;
  department: string | null;
  personalTitle: string | null;
  employmentStatus: string | null;
  userId: number | null;
  username: string | null;
  roleId: number | null;
  accountActive: boolean | null;
  requirePasswordChange: boolean | null;
  accountCreatedAt: string | null;
  accountUpdatedAt: string | null;
}

interface Stats {
  total_personnel: number;
  with_account: number;
  without_account: number;
  active_accounts: number;
  inactive_accounts: number;
}

type AccountStatusFilter = "all" | "with" | "without" | "active" | "inactive";

const ROLES = [
  { value: 1, label: "Super Admin", desc: "Full system access" },
  { value: 6, label: "School Admin", desc: "Manage everything" },
  { value: 7, label: "Teacher", desc: "Classes & grades" },
  { value: 8, label: "Student", desc: "Own grades only" },
];

const ROLE_LABEL: Record<number, string> = {
  1: "Super Admin", 2: "Admin", 3: "Dept Head", 4: "School Head",
  5: "Planning", 6: "School Admin", 7: "Teacher", 8: "Student", 9: "Guard",
};
const ROLE_COLOR: Record<number, string> = {
  1: "bg-rose-100 text-rose-700",
  6: "bg-indigo-100 text-indigo-700",
  7: "bg-emerald-100 text-emerald-700",
  8: "bg-sky-100 text-sky-700",
};

function initials(first?: string | null, last?: string | null): string {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}
function fmtDate(s: string | null): string {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return "—"; }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState<AccountStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", password: "", roleId: 7, isActive: true });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        `/api/admin/users?search=${encodeURIComponent(search)}` +
        `&accountStatus=${accountStatus}` +
        (roleFilter !== "all" ? `&roleId=${roleFilter}` : "") +
        `&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setUsers(json.data || []);
        setTotal(json.total || 0);
        setStats(json.stats || null);
      }
    } finally {
      setLoading(false);
    }
  }, [search, accountStatus, roleFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function openCreate(u: User) {
    setEditingUser(u);
    // Suggest username: firstname.lastname (lowercase, no spaces)
    const fn = (u.firstName || "").trim().toLowerCase().replace(/\s+/g, "");
    const ln = (u.lastName || "").trim().toLowerCase().replace(/\s+/g, "");
    setForm({ username: fn && ln ? `${fn}.${ln}` : "", password: "", roleId: 7, isActive: true });
    setError(null);
    setShowPwd(false);
    setModalOpen(true);
  }
  function openEdit(u: User) {
    setEditingUser(u);
    setForm({ username: u.username || "", password: "", roleId: u.roleId ?? 7, isActive: u.accountActive ?? true });
    setError(null);
    setShowPwd(false);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!editingUser) return;

    if (!editingUser.userId) {
      // Create account
      if (!form.username.trim()) { setError("Username is required"); return; }
      if (!form.password || form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    } else {
      if (!form.username.trim()) { setError("Username is required"); return; }
      if (form.password && form.password.length < 8) { setError("New password must be at least 8 characters"); return; }
    }

    setSaving(true);
    setError(null);
    try {
      if (!editingUser.userId) {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            basicInfoId: editingUser.basicInfoId,
            username: form.username.trim(),
            password: form.password,
            roleId: form.roleId,
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Failed to create"); return; }
      } else {
        const res = await fetch(`/api/admin/users/${editingUser.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username.trim(),
            roleId: form.roleId,
            isActive: form.isActive,
            ...(form.password ? { newPassword: form.password } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Failed to update"); return; }
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    if (!u.userId) return;
    try {
      const res = await fetch(`/api/admin/users/${u.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.accountActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((x) => (x.userId === u.userId ? { ...x, accountActive: !x.accountActive } : x))
        );
      }
    } catch {/* noop */}
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            User Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage login accounts for personnel — assign roles and reset passwords.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Personnel</p>
            <p className="text-2xl font-bold">{stats.total_personnel}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">With Account</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.with_account}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Without Account</p>
            <p className="text-2xl font-bold text-amber-600">{stats.without_account}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.active_accounts}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-rose-600">{stats.inactive_accounts}</p>
          </CardContent></Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, username, employee ID…"
              className="pl-9"
            />
          </div>
          <Select value={accountStatus} onValueChange={(v) => { setAccountStatus(v as AccountStatusFilter); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All personnel</SelectItem>
              <SelectItem value="with">With account</SelectItem>
              <SelectItem value="without">Without account</SelectItem>
              <SelectItem value="active">Active accounts</SelectItem>
              <SelectItem value="inactive">Inactive accounts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
              ))}
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
                  <TableHead>Personnel</TableHead>
                  <TableHead className="w-[200px]">Department</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="w-[130px]">Role</TableHead>
                  <TableHead className="w-[110px]">Account</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-indigo-600" /> Loading…
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No personnel match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u, i) => (
                    <TableRow key={u.personnelId} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">{(page - 1) * limit + i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {u.imgPath && <AvatarImage src={u.imgPath.startsWith("http") ? u.imgPath : `${R2}/${u.imgPath}`} />}
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                              {initials(u.firstName, u.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {u.lastName}, {u.firstName} {u.middleName ? u.middleName[0] + "." : ""}{u.suffix ? " " + u.suffix : ""}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {u.employeeId ? `ID: ${u.employeeId}` : "—"}
                              {u.employmentStatus && ` · ${u.employmentStatus}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.department || "—"}</TableCell>
                      <TableCell>
                        {u.username ? (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{u.username}</code>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No account</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.roleId ? (
                          <Badge className={`text-[10px] ${ROLE_COLOR[u.roleId] || "bg-slate-100 text-slate-700"}`}>
                            {ROLE_LABEL[u.roleId] || `Role ${u.roleId}`}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!u.userId ? (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                            <UserX className="h-3 w-3 mr-1" /> None
                          </Badge>
                        ) : (
                          <button
                            onClick={() => toggleActive(u)}
                            className={
                              u.accountActive
                                ? "inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded text-xs font-medium transition"
                                : "inline-flex items-center gap-1 text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded text-xs font-medium transition"
                            }
                            title={`Click to ${u.accountActive ? "deactivate" : "activate"}`}
                          >
                            {u.accountActive ? <><UserCheck className="h-3 w-3" /> Active</> : <><UserX className="h-3 w-3" /> Inactive</>}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.userId ? (
                          <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => openCreate(u)} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
                            <UserPlus className="h-3.5 w-3.5 mr-1" /> Create
                          </Button>
                        )}
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
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingUser?.userId ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {editingUser?.userId ? "Edit User Account" : "Create User Account"}
            </DialogTitle>
            <DialogDescription>
              {editingUser && (
                <span>
                  For: <strong className="text-foreground">
                    {editingUser.lastName}, {editingUser.firstName}
                  </strong>
                  {editingUser.department && <> · {editingUser.department}</>}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. juan.delacruz or juan@anhs.edu.ph"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">Letters, numbers, dots, underscores, hyphens, and @ only.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser?.userId ? "New Password (optional)" : "Password *"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser?.userId ? "Leave blank to keep current password" : "At least 8 characters"}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {editingUser?.userId && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Setting a new password will require user to change it on next login.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={String(form.roleId)} onValueChange={(v) => setForm({ ...form, roleId: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={String(r.value)}>
                        <div>
                          <p className="text-sm font-medium">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingUser?.userId && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.isActive ? "active" : "inactive"} onValueChange={(v) => setForm({ ...form, isActive: v === "active" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingUser?.userId ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
