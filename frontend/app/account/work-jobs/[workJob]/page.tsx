import WorkJobDetailPage from "@/components/customer/work-jobs/WorkJobDetailPage";

export default async function CustomerWorkJobRoute({
  params,
}: {
  params: Promise<{ workJob: string }>;
}) {
  const { workJob } = await params;

  return <WorkJobDetailPage workJobId={workJob} />;
}
