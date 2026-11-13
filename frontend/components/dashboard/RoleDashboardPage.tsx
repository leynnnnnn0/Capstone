"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, type LucideIcon } from "lucide-react";

import AdminDashboardPage, { AdminDashboardSkeleton } from "@/components/dashboard/AdminDashboardPage";
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
    return <AdminDashboardSkeleton />;
  }

  const role = primaryRole(user);

  if (role === "admin") return <AdminDashboardPage firstName={user?.first_name} />;
  if (role === "owner") return <OwnerDashboard user={user} />;
  if (role === "staff") return <WorkerDashboardPage user={user} />;

  return <CustomerFallbackDashboard />;
}

function OwnerDashboard({ user }: { user: User | null }) {
  return (
    <div className="space-y-6">
      <DashboardHeading title={`Welcome back, ${user?.first_name ?? "there"}`} description="Operational view for appointments, work jobs, calendar, products, and reports." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickCard featured title="Appointments" description="Review, schedule, and update customer appointments." href="/dashboard/appointments" icon={CalendarDays} />
        <QuickCard title="Work Jobs" description="Create jobs from approved appointments and track progress." href="/dashboard/work-jobs" icon={BriefcaseBusiness} />
        <QuickCard title="Calendar" description="See appointments and staff schedules in one place." href="/dashboard/calendar" icon={CalendarDays} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access Scope</CardTitle>
          <CardDescription>Owners can operate the business workflow without managing roles or deleting accounts.</CardDescription>
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

function DashboardHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="staff-overview-title font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function QuickCard({
  title,
  description,
  href,
  icon: Icon,
  featured = false,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  featured?: boolean;
}) {
  return (
    <Card className={featured ? "md:col-span-2" : undefined}>
      <CardHeader className={featured ? "space-y-3 bg-secondary" : "space-y-3"}>
        <div className="staff-summary-icon size-11">
          <Icon className="size-5" />
        </div>
        <div>
          <CardTitle className={featured ? "text-xl" : "text-base"}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className={featured ? "pt-4 sm:pt-5 lg:pt-6" : undefined}>
        <Button asChild variant={featured ? "default" : "outline"} size="sm">
          <Link href={href}>Open {title.toLowerCase()}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
