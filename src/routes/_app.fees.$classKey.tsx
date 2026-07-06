import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FEE_CLASSES, classLabel, currentMonth, formatMonth } from "@/lib/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, History, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/fees/$classKey")({ component: FeesClass });

type Row = { id: string; name: string; monthly_fees: number; paidId?: string; paidDate?: string };

function FeesClass() {
  const { classKey } = Route.useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const valid = FEE_CLASSES.some((c) => c.key === classKey);
  const month = currentMonth();

  async function load() {
    if (!user) return;
    const [{ data: students }, { data: pays }] = await Promise.all([
      supabase.from("students").select("id, name, monthly_fees, status").eq("user_id", user.id).eq("class_level", classKey).order("name"),
      supabase.from("fee_payments").select("id, student_id, payment_date").eq("user_id", user.id).eq("fee_month", month),
    ]);
    const paidMap = new Map((pays ?? []).map((p) => [p.student_id, p]));
    setRows((students ?? []).filter((s) => s.status === "active").map((s) => {
      const p = paidMap.get(s.id);
      return { id: s.id, name: s.name, monthly_fees: Number(s.monthly_fees), paidId: p?.id, paidDate: p?.payment_date };
    }));
  }
  useEffect(() => { load(); }, [user, classKey]);

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  const pendingCount = rows.filter((r) => !r.paidId).length;

  async function markPaid(row: Row) {
    if (!user) return;
    const { error } = await supabase.from("fee_payments").insert({
      user_id: user.id, student_id: row.id, amount_paid: row.monthly_fees,
      payment_date: new Date().toISOString().slice(0, 10), fee_month: month,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Marked paid"); load();
  }

  if (!valid) return <p>Invalid class.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/fees" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> All classes
          </Link>
          <h1 className="font-display text-4xl">{classLabel(classKey)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Students Pending This Month ({formatMonth(month)}): <b className="text-foreground">{pendingCount}</b>
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No students in this class.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Monthly Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">₹{r.monthly_fees}</td>
                  <td className="px-4 py-3">
                    {r.paidId ? <Badge>Paid</Badge> : <Badge variant="secondary">Pending</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.paidDate || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {!r.paidId && (
                        <Button size="sm" onClick={() => markPaid(r)}><Check className="mr-1 h-4 w-4" /> Mark Paid</Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/fees/$classKey/$studentId/history" params={{ classKey, studentId: r.id }}>
                          <History className="mr-1 h-4 w-4" /> History
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
