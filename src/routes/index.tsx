import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Wallet, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl">Coaching Manager</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
            <Button asChild><Link to="/register">Register</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">For coaching institutes</p>
          <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
            Run your coaching, <em className="text-primary">calmly.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            One private workspace for your students, teachers, fees, and salaries — organized the way a coaching actually works.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link to="/register">Create your workspace</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Login</Link></Button>
          </div>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Users, title: "Students", desc: "Add, promote, and organize by class." },
            { Icon: GraduationCap, title: "Teachers", desc: "One clean roster with subjects & status." },
            { Icon: Wallet, title: "Fees", desc: "Track monthly fees per class with history." },
            { Icon: LineChart, title: "Dashboard", desc: "Live totals, pending fees, salaries." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-2xl">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Coaching Manager
      </footer>
    </div>
  );
}
