import { Outlet, Link, useRouterState, useNavigate, Navigate, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, GraduationCap, Wallet, Banknote, LogOut, ChevronDown, Menu, X, UserPlus, ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { session, loading } = useAuth();
  const [open, setOpen] = useState(false);
  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!session) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-display text-lg">Coaching Manager</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [studentOpen, setStudentOpen] = useState(pathname.startsWith("/students"));
  const [teacherOpen, setTeacherOpen] = useState(pathname.startsWith("/teachers"));

  async function logout() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  const linkCls = (active: boolean) =>
    cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
       active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground");
  const subLinkCls = (active: boolean) =>
    cn("flex items-center gap-2 rounded-md py-1.5 pl-9 pr-3 text-sm transition-colors",
       active ? "text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground");

  const content = (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-xl">Coaching</span>
        </div>
        <button className="md:hidden" onClick={onClose}><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <Link to="/dashboard" className={linkCls(pathname === "/dashboard")} onClick={onClose}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>

        <button onClick={() => setStudentOpen((v) => !v)} className={cn(linkCls(pathname.startsWith("/students")), "w-full justify-between")}>
          <span className="flex items-center gap-3"><Users className="h-4 w-4" /> Student</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", studentOpen && "rotate-180")} />
        </button>
        {studentOpen && (
          <div className="space-y-0.5 py-1">
            <Link to="/students/add" className={subLinkCls(pathname === "/students/add")} onClick={onClose}>
              <UserPlus className="h-3.5 w-3.5" /> Add Student
            </Link>
            <Link to="/students" className={subLinkCls(pathname === "/students" || (pathname.startsWith("/students/") && pathname !== "/students/add"))} onClick={onClose}>
              <ListChecks className="h-3.5 w-3.5" /> List of Students
            </Link>
          </div>
        )}

        <button onClick={() => setTeacherOpen((v) => !v)} className={cn(linkCls(pathname.startsWith("/teachers")), "w-full justify-between")}>
          <span className="flex items-center gap-3"><GraduationCap className="h-4 w-4" /> Teacher</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", teacherOpen && "rotate-180")} />
        </button>
        {teacherOpen && (
          <div className="space-y-0.5 py-1">
            <Link to="/teachers/add" className={subLinkCls(pathname === "/teachers/add")} onClick={onClose}>
              <Plus className="h-3.5 w-3.5" /> Add Teacher
            </Link>
            <Link to="/teachers" className={subLinkCls(pathname === "/teachers")} onClick={onClose}>
              <ListChecks className="h-3.5 w-3.5" /> Teacher List
            </Link>
          </div>
        )}

        <Link to="/fees" className={linkCls(pathname.startsWith("/fees"))} onClick={onClose}>
          <Wallet className="h-4 w-4" /> Fees
        </Link>
        <Link to="/payments" className={linkCls(pathname.startsWith("/payments"))} onClick={onClose}>
          <Banknote className="h-4 w-4" /> Payment
        </Link>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button onClick={logout} className={cn(linkCls(false), "w-full")}>
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 md:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative h-full w-72" onClick={(e) => e.stopPropagation()}>{content}</div>
        </div>
      )}
    </>
  );
}
