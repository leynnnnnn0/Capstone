import AdminWorkJobForm from "@/components/admin-work-jobs/AdminWorkJobForm";

export default async function DashboardWorkJobEditRoute({
  params,
}: {
  params: Promise<{ workJob: string }>;
}) {
  const { workJob } = await params;

  return <AdminWorkJobForm workJobId={workJob} />;
}
