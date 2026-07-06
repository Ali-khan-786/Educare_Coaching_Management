import { createFileRoute } from "@tanstack/react-router";
import { Fragment as FragmentWithKey, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/teachers/")({ component: TeachersList });

type Teacher = {
  id: string; name: string; phone: string | null; subjects: string | null;
  salary: number; joining_date: string; qualification: string | null; status: string;
};

function TeachersList() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("teachers").select("*").eq("user_id", user.id).order("name");
    setTeachers((data ?? []) as Teacher[]);
  }
  useEffect(() => { load(); }, [user]);

  const filtered = teachers.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || (t.phone ?? "").includes(q));

  async function doDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("teachers").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Teacher deleted"); setDeleting(null); load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Teachers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Total: {teachers.length}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No teachers yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <FragmentWithKey key={t.id}>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.phone || "—"}</td>
                    <td className="px-4 py-3">{t.subjects || "—"}</td>
                    <td className="px-4 py-3"><Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                          {expanded === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expanded === t.id && (
                    <tr key={t.id + "-x"} className="border-t border-border bg-muted/30">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <Info label="Salary" value={`₹${t.salary}`} />
                          <Info label="Joining Date" value={t.joining_date} />
                          <Info label="Qualification" value={t.qualification} />
                          <Info label="Status" value={t.status} />
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

      {editing && <EditDialog t={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the teacher record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
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

function EditDialog({ t, onClose, onSaved }: { t: Teacher; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ ...t, salary: String(t.salary) });
  const [saving, setSaving] = useState(false);
  const u = (k: keyof typeof f, v: any) => setF({ ...f, [k]: v });

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("teachers").update({
      name: f.name, phone: f.phone, subjects: f.subjects, salary: Number(f.salary) || 0,
      joining_date: f.joining_date, qualification: f.qualification, status: f.status,
    }).eq("id", t.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Teacher updated"); onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Edit Teacher</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Name"><Input value={f.name} onChange={(e) => u("name", e.target.value)} /></F>
          <F label="Phone"><Input value={f.phone ?? ""} onChange={(e) => u("phone", e.target.value)} /></F>
          <F label="Subjects"><Input value={f.subjects ?? ""} onChange={(e) => u("subjects", e.target.value)} /></F>
          <F label="Salary"><Input type="number" value={f.salary} onChange={(e) => u("salary", e.target.value)} /></F>
          <F label="Joining Date"><Input type="date" value={f.joining_date} onChange={(e) => u("joining_date", e.target.value)} /></F>
          <F label="Qualification"><Input value={f.qualification ?? ""} onChange={(e) => u("qualification", e.target.value)} /></F>
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
