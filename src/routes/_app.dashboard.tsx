import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { currentMonth, formatMonth } from "@/lib/classes";
import { Users, GraduationCap, TrendingUp, AlertCircle, Wallet, UserPlus, StickyNote, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type Stats = {
  totalStudents: number;
  totalTeachers: number;
  feesCollected: number;
  feesPending: number;
  salariesPending: number;
  newAdmissions: number;
};

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ coaching_name: string; username: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notices, setNotices] = useState<{ id: string; content: string }[]>([]);
  const [newNotice, setNewNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: students }, { data: teachers }, { data: fees }, { data: teacherPays }, { data: nots }] = await Promise.all([
        supabase.from("profiles").select("coaching_name, username").eq("id", user.id).maybeSingle(),
        supabase.from("students").select("id, monthly_fees, status, class_level, joining_date, created_at").eq("user_id", user.id),
        supabase.from("teachers").select("id, salary, status").eq("user_id", user.id),
        supabase.from("fee_payments").select("amount_paid, fee_month, student_id").eq("user_id", user.id),
        supabase.from("teacher_payments").select("teacher_id, salary_month").eq("user_id", user.id),
        supabase.from("notices").select("id, content").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const month = currentMonth();
      const activeStudents = (students ?? []).filter((s) => s.status === "active" && s.class_level !== "alumni");
      const activeTeachers = (teachers ?? []).filter((t) => t.status === "active");
      const feesThisMonth = (fees ?? []).filter((f) => f.fee_month === month);
      const feesCollected = feesThisMonth.reduce((sum, f) => sum + Number(f.amount_paid), 0);
      const paidStudentIds = new Set(feesThisMonth.map((f) => f.student_id));
      const feesPending = activeStudents.filter((s) => !paidStudentIds.has(s.id)).reduce((sum, s) => sum + Number(s.monthly_fees), 0);
      const paidTeacherIds = new Set((teacherPays ?? []).filter((p) => p.salary_month === month).map((p) => p.teacher_id));
      const salariesPending = activeTeachers.filter((t) => !paidTeacherIds.has(t.id)).reduce((sum, t) => sum + Number(t.salary), 0);

      const now = new Date();
      const newAdmissions = (students ?? []).filter((s) => {
        const d = new Date(s.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length;

      setProfile(prof);
      setStats({
        totalStudents: activeStudents.length,
        totalTeachers: activeTeachers.length,
        feesCollected,
        feesPending,
        salariesPending,
        newAdmissions,
      });
      setNotices(nots ?? []);
    })();
  }, [user]);

  async function addNotice() {
    if (!newNotice.trim() || !user) return;
    const { data, error } = await supabase.from("notices").insert({ user_id: user.id, content: newNotice.trim() }).select().single();
    if (error) { toast.error(error.message); return; }
    setNotices([data, ...notices]);
    setNewNotice("");
  }
  async function delNotice(id: string) {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setNotices(notices.filter((n) => n.id !== id));
  }
  async function saveEdit(id: string) {
    const { error } = await supabase.from("notices").update({ content: editContent.trim() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setNotices(notices.map((n) => (n.id === id ? { ...n, content: editContent.trim() } : n)));
    setEditingId(null);
  }

  const cards = [
    { title: "Total Students", value: stats?.totalStudents ?? "—", Icon: Users, color: "text-primary" },
    { title: "Total Teachers", value: stats?.totalTeachers ?? "—", Icon: GraduationCap, color: "text-primary" },
    { title: `Fees Collected · ${formatMonth(currentMonth())}`, value: stats ? `₹${stats.feesCollected.toLocaleString()}` : "—", Icon: Wallet, color: "text-primary" },
    { title: "Fees Pending", value: stats ? `₹${stats.feesPending.toLocaleString()}` : "—", Icon: AlertCircle, color: "text-destructive" },
    { title: "Teachers Salary Pending", value: stats ? `₹${stats.salariesPending.toLocaleString()}` : "—", Icon: AlertCircle, color: "text-destructive" },
    { title: "New Admissions This Month", value: stats?.newAdmissions ?? "—", Icon: UserPlus, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back{profile?.username ? `, ${profile.username}` : ""}</p>
        <h1 className="mt-1 font-display text-4xl">{profile?.coaching_name || "Your Dashboard"}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ title, value, Icon, color }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{title}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-3 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl">Notices</h2>
        </div>
        <div className="flex gap-2">
          <Textarea placeholder="Write a coaching reminder…" value={newNotice} onChange={(e) => setNewNotice(e.target.value)} className="min-h-[60px]" />
          <Button onClick={addNotice} disabled={!newNotice.trim()}>Add</Button>
        </div>
        <div className="mt-4 space-y-2">
          {notices.length === 0 && <p className="text-sm text-muted-foreground">No notices yet.</p>}
          {notices.map((n) => (
            <div key={n.id} className="flex items-start gap-2 rounded-lg border border-border bg-background p-3">
              {editingId === n.id ? (
                <>
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[60px] flex-1" />
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => saveEdit(n.id)}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex-1 whitespace-pre-wrap text-sm">{n.content}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(n.id); setEditContent(n.content); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => delNotice(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
