import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatMonth } from "@/lib/classes";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/payments/$teacherId/history")({ component: History });

type Rec = { id: string; payment_date: string; amount_paid: number; salary_month: string };

function History() {
  const { teacherId } = Route.useParams();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("teachers").select("name").eq("id", teacherId).maybeSingle(),
        supabase.from("teacher_payments").select("id, payment_date, amount_paid, salary_month").eq("user_id", user.id).eq("teacher_id", teacherId).order("payment_date", { ascending: false }),
      ]);
      setName(t?.name ?? "");
      setRecs((p ?? []) as Rec[]);
    })();
  }, [user, teacherId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/payments" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Teacher Salary
        </Link>
        <h1 className="font-display text-4xl">Payment History</h1>
        <p className="mt-1 text-sm text-muted-foreground">{name}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {recs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No salary records yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.payment_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatMonth(r.salary_month)}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{Number(r.amount_paid).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
