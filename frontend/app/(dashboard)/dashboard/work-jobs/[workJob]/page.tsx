import AdminWorkJobShowPage from "@/components/admin-work-jobs/AdminWorkJobShowPage";

export default async function DashboardWorkJobShowRoute({
  params,
}: {
  params: Promise<{ workJob: string }>;
}) {
  const { workJob } = await params;

  return <AdminWorkJobShowPage workJobId={workJob} />;
}
