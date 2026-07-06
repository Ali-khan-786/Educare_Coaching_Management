import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FEE_CLASSES, currentMonth, formatMonth } from "@/lib/classes";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_app/fees/")({ component: FeesIndex });

function FeesIndex() {
  const { user } = useAuth();
  const [pending, setPending] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const month = currentMonth();
      const [{ data: students }, { data: pays }] = await Promise.all([
        supabase.from("students").select("id, class_level, status").eq("user_id", user.id),
        supabase.from("fee_payments").select("student_id").eq("user_id", user.id).eq("fee_month", month),
      ]);
      const paidIds = new Set((pays ?? []).map((p) => p.student_id));
      const map: Record<string, number> = {};
      (students ?? []).forEach((s) => {
        if (s.class_level === "alumni" || s.status !== "active") return;
        if (!paidIds.has(s.id)) map[s.class_level] = (map[s.class_level] ?? 0) + 1;
      });
      setPending(map);
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Fees</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatMonth(currentMonth())} · choose a class to collect fees.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {FEE_CLASSES.map((c) => (
          <Link key={c.key} to="/fees/$classKey" params={{ classKey: c.key }}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
            <div className="flex items-center justify-between">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">{pending[c.key] ?? 0} pending</span>
            </div>
            <h3 className="mt-4 font-display text-2xl group-hover:text-primary">{c.label}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
