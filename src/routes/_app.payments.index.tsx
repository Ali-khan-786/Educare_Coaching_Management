import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { currentMonth, formatMonth } from "@/lib/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, History, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/payments/")({ component: PaymentsIndex });

type Row = { id: string; name: string; salary: number; paidId?: string; paidDate?: string };

function PaymentsIndex() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const month = currentMonth();

  async function load() {
    if (!user) return;
    const [{ data: teachers }, { data: pays }] = await Promise.all([
      supabase.from("teachers").select("id, name, salary, status").eq("user_id", user.id).order("name"),
      supabase.from("teacher_payments").select("id, teacher_id, payment_date").eq("user_id", user.id).eq("salary_month", month),
    ]);
    const paidMap = new Map((pays ?? []).map((p) => [p.teacher_id, p]));
    setRows((teachers ?? []).filter((t) => t.status === "active").map((t) => {
      const p = paidMap.get(t.id);
      return { id: t.id, name: t.name, salary: Number(t.salary), paidId: p?.id, paidDate: p?.payment_date };
    }));
  }
  useEffect(() => { load(); }, [user]);

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  async function markPaid(row: Row) {
    if (!user) return;
    const { error } = await supabase.from("teacher_payments").insert({
      user_id: user.id, teacher_id: row.id, amount_paid: row.salary,
      payment_date: new Date().toISOString().slice(0, 10), salary_month: month,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Salary marked paid"); load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Teacher Salary</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatMonth(month)}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No active teachers.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">₹{r.salary}</td>
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
                        <Link to="/payments/$teacherId/history" params={{ teacherId: r.id }}>
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
