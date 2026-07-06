import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment as FragmentWithKey, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CLASSES, classLabel, ageFromDob, nextClass } from "@/lib/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Pencil, Trash2, ArrowUpRight, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/students/$classKey")({ component: ClassStudents });

type Student = {
  id: string; name: string; phone: string | null; father_name: string | null; father_phone: string | null;
  mother_name: string | null; mother_phone: string | null; school_name: string | null; class_level: string;
  date_of_birth: string | null; joining_date: string; monthly_fees: number; status: string;
};

function ClassStudents() {
  const { classKey } = Route.useParams();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [promoting, setPromoting] = useState<Student | null>(null);

  const label = classLabel(classKey);
  const valid = CLASSES.some((c) => c.key === classKey);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("students").select("*").eq("user_id", user.id).eq("class_level", classKey).order("name");
    setStudents((data ?? []) as Student[]);
  }
  useEffect(() => { load(); }, [user, classKey]);

  const filtered = students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || (s.phone ?? "").includes(q));

  async function doDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("students").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Student deleted");
    setDeleting(null); load();
  }
  async function doPromote() {
    if (!promoting) return;
    const target = nextClass(promoting.class_level);
    const { error } = await supabase.from("students").update({ class_level: target }).eq("id", promoting.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Promoted to ${classLabel(target)}`);
    setPromoting(null); load();
  }

  if (!valid) return <p>Invalid class.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/students" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> All classes
          </Link>
          <h1 className="font-display text-4xl">{label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Total: {students.length} student{students.length === 1 ? "" : "s"}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No students in this class.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <FragmentWithKey key={s.id}>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {classKey !== "alumni" && (
                          <Button size="sm" variant="ghost" onClick={() => setPromoting(s)} title="Promote">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                          {expanded === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expanded === s.id && (
                    <tr key={s.id + "-x"} className="border-t border-border bg-muted/30">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <Info label="Father's Name" value={s.father_name} />
                          <Info label="Father's Phone" value={s.father_phone} />
                          <Info label="Mother's Name" value={s.mother_name} />
                          <Info label="Mother's Phone" value={s.mother_phone} />
                          <Info label="School Name" value={s.school_name} />
                          <Info label="Date of Birth" value={s.date_of_birth} />
                          <Info label="Age" value={ageFromDob(s.date_of_birth)?.toString() ?? null} />
                          <Info label="Joining Date" value={s.joining_date} />
                          <Info label="Monthly Fees" value={`₹${s.monthly_fees}`} />
                          <Info label="Class" value={classLabel(s.class_level)} />
                          <Info label="Status" value={s.status} />
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentWithKey>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <EditDialog student={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the student record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!promoting} onOpenChange={(o) => !o && setPromoting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote {promoting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Moves the student to <b>{promoting ? classLabel(nextClass(promoting.class_level)) : ""}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doPromote}>Promote</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

function EditDialog({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ ...student, date_of_birth: student.date_of_birth ?? "", monthly_fees: String(student.monthly_fees) });
  const [saving, setSaving] = useState(false);
  function u<K extends keyof typeof f>(k: K, v: any) { setF({ ...f, [k]: v }); }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("students").update({
      name: f.name, phone: f.phone, father_name: f.father_name, father_phone: f.father_phone,
      mother_name: f.mother_name, mother_phone: f.mother_phone, school_name: f.school_name,
      class_level: f.class_level, date_of_birth: f.date_of_birth || null, joining_date: f.joining_date,
      monthly_fees: Number(f.monthly_fees) || 0, status: f.status,
    }).eq("id", student.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Student updated");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Name"><Input value={f.name} onChange={(e) => u("name", e.target.value)} /></F>
          <F label="Phone"><Input value={f.phone ?? ""} onChange={(e) => u("phone", e.target.value)} /></F>
          <F label="Father's Name"><Input value={f.father_name ?? ""} onChange={(e) => u("father_name", e.target.value)} /></F>
          <F label="Father's Phone"><Input value={f.father_phone ?? ""} onChange={(e) => u("father_phone", e.target.value)} /></F>
          <F label="Mother's Name"><Input value={f.mother_name ?? ""} onChange={(e) => u("mother_name", e.target.value)} /></F>
          <F label="Mother's Phone"><Input value={f.mother_phone ?? ""} onChange={(e) => u("mother_phone", e.target.value)} /></F>
          <F label="School Name"><Input value={f.school_name ?? ""} onChange={(e) => u("school_name", e.target.value)} /></F>
          <F label="Class">
            <Select value={f.class_level} onValueChange={(v) => u("class_level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CLASSES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Date of Birth"><Input type="date" value={f.date_of_birth} onChange={(e) => u("date_of_birth", e.target.value)} /></F>
          <F label="Joining Date"><Input type="date" value={f.joining_date} onChange={(e) => u("joining_date", e.target.value)} /></F>
          <F label="Monthly Fees"><Input type="number" value={f.monthly_fees} onChange={(e) => u("monthly_fees", e.target.value)} /></F>
          <F label="Status">
            <Select value={f.status} onValueChange={(v) => u("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
