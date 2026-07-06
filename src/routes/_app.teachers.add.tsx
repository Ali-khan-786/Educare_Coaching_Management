import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/teachers/add")({ component: AddTeacher });

function AddTeacher() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    name: "", phone: "", subjects: "", salary: "",
    joining_date: new Date().toISOString().slice(0, 10), qualification: "", status: "active",
  });
  const u = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("teachers").insert({
      user_id: user.id, ...f, salary: Number(f.salary) || 0,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Teacher added");
    nav({ to: "/teachers" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl">Add Teacher</h1>
      </div>
      <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
        <Field label="Name" required><Input value={f.name} onChange={(e) => u("name", e.target.value)} required /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => u("phone", e.target.value)} /></Field>
        <Field label="Subjects"><Input value={f.subjects} onChange={(e) => u("subjects", e.target.value)} placeholder="Math, Physics" /></Field>
        <Field label="Salary (₹)"><Input type="number" value={f.salary} onChange={(e) => u("salary", e.target.value)} /></Field>
        <Field label="Joining Date"><Input type="date" value={f.joining_date} onChange={(e) => u("joining_date", e.target.value)} /></Field>
        <Field label="Qualification"><Input value={f.qualification} onChange={(e) => u("qualification", e.target.value)} /></Field>
        <Field label="Status">
          <Select value={f.status} onValueChange={(v) => u("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/teachers" })}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Add Teacher"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}
