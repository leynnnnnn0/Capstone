import AdminAuditShowPage from "@/components/admin-audits/AdminAuditShowPage";

export default async function DashboardAuditShowRoute({
  params,
}: {
  params: Promise<{ audit: string }>;
}) {
  const { audit } = await params;

  return <AdminAuditShowPage auditId={audit} />;
}
