"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, Loader2, type LucideIcon } from "lucide-react";

import AdminDashboardPage from "@/components/dashboard/AdminDashboardPage";
import WorkerDashboardPage from "@/components/dashboard/WorkerDashboardPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchCurrentUser, primaryRole } from "@/features/auth/current-user-api";
import type { User } from "@/types/user";

export default function RoleDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((response) => setUser(response.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  const role = primaryRole(user);

  if (role === "admin") return <AdminDashboardPage />;
  if (role === "sub_admin") return <SubAdminDashboard user={user} />;
  if (role === "worker") return <WorkerDashboardPage user={user} />;

  return <CustomerFallbackDashboard />;
}

function SubAdminDashboard({ user }: { user: User | null }) {
  return (
    <div className="space-y-6">
      <DashboardHeading eyebrow="Sub Admin Dashboard" title={`Welcome back, ${user?.first_name ?? "there"}`} description="Operational view for appointments, work jobs, calendar, products, and reports." />
      <div className="grid gap-4 md:grid-cols-3">
        <QuickCard title="Appointments" description="Review, schedule, and update customer appointments." href="/dashboard/appointments" icon={CalendarDays} />
        <QuickCard title="Work Jobs" description="Create jobs from approved appointments and track progress." href="/dashboard/work-jobs" icon={BriefcaseBusiness} />
        <QuickCard title="Calendar" description="See appointments and worker schedules in one place." href="/dashboard/calendar" icon={CalendarDays} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access Scope</CardTitle>
          <CardDescription>Sub admins can operate the business workflow without managing roles or deleting accounts.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function CustomerFallbackDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customer Account</CardTitle>
        <CardDescription>Customer accounts use the customer portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/account">Go to Customer Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function QuickCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
