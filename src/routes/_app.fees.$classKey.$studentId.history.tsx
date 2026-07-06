import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { classLabel, formatMonth } from "@/lib/classes";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/fees/$classKey/$studentId/history")({ component: History });

type Rec = { id: string; payment_date: string; amount_paid: number; fee_month: string };

function History() {
  const { classKey, studentId } = Route.useParams();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("students").select("name").eq("id", studentId).maybeSingle(),
        supabase.from("fee_payments").select("id, payment_date, amount_paid, fee_month").eq("user_id", user.id).eq("student_id", studentId).order("payment_date", { ascending: false }),
      ]);
      setName(s?.name ?? "");
      setRecs((p ?? []) as Rec[]);
    })();
  }, [user, studentId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/fees/$classKey" params={{ classKey }} className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> {classLabel(classKey)}
        </Link>
        <h1 className="font-display text-4xl">Payment History</h1>
        <p className="mt-1 text-sm text-muted-foreground">{name}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {recs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No fee records yet.</div>
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
                  <td className="px-4 py-3 text-muted-foreground">{formatMonth(r.fee_month)}</td>
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
