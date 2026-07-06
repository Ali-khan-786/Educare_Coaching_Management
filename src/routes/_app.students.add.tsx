import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSES } from "@/lib/classes";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/students/add")({ component: AddStudent });

function AddStudent() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", father_name: "", father_phone: "", mother_name: "", mother_phone: "",
    school_name: "", class_level: "class_1", date_of_birth: "", joining_date: new Date().toISOString().slice(0, 10),
    monthly_fees: "", status: "active",
  });

  function upd<K extends keyof typeof form>(k: K, v: string) { setForm({ ...form, [k]: v }); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("students").insert({
      user_id: user.id,
      ...form,
      monthly_fees: Number(form.monthly_fees) || 0,
      date_of_birth: form.date_of_birth || null,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Student added");
    nav({ to: "/students/$classKey", params: { classKey: form.class_level } });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl">Add Student</h1>
        <p className="mt-1 text-sm text-muted-foreground">Age is calculated automatically from date of birth.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
        <Field label="Student Name" required><Input value={form.name} onChange={(e) => upd("name", e.target.value)} required /></Field>
        <Field label="Student Phone"><Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} /></Field>
        <Field label="Father's Name"><Input value={form.father_name} onChange={(e) => upd("father_name", e.target.value)} /></Field>
        <Field label="Father's Phone"><Input value={form.father_phone} onChange={(e) => upd("father_phone", e.target.value)} /></Field>
        <Field label="Mother's Name"><Input value={form.mother_name} onChange={(e) => upd("mother_name", e.target.value)} /></Field>
        <Field label="Mother's Phone"><Input value={form.mother_phone} onChange={(e) => upd("mother_phone", e.target.value)} /></Field>
        <Field label="School Name"><Input value={form.school_name} onChange={(e) => upd("school_name", e.target.value)} /></Field>
        <Field label="Class" required>
          <Select value={form.class_level} onValueChange={(v) => upd("class_level", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CLASSES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Date of Birth"><Input type="date" value={form.date_of_birth} onChange={(e) => upd("date_of_birth", e.target.value)} /></Field>
        <Field label="Joining Date"><Input type="date" value={form.joining_date} onChange={(e) => upd("joining_date", e.target.value)} /></Field>
        <Field label="Monthly Fees (₹)"><Input type="number" value={form.monthly_fees} onChange={(e) => upd("monthly_fees", e.target.value)} /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => upd("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/students" })}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Add Student"}</Button>
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
