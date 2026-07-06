import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CLASSES } from "@/lib/classes";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_app/students/")({ component: StudentsIndex });

function StudentsIndex() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("students").select("class_level").eq("user_id", user.id);
      const c: Record<string, number> = {};
      (data ?? []).forEach((s) => { c[s.class_level] = (c[s.class_level] ?? 0) + 1; });
      setCounts(c);
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a class to manage students.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CLASSES.map((c) => (
          <Link key={c.key} to="/students/$classKey" params={{ classKey: c.key }}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">{counts[c.key] ?? 0} students</span>
            </div>
            <h3 className="mt-4 font-display text-2xl group-hover:text-primary">{c.label}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
