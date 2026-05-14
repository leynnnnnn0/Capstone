import AdminAppointmentShowPage from "@/components/admin-appointments/AdminAppointmentShowPage";

export default async function DashboardAppointmentShowRoute({
  params,
}: {
  params: Promise<{ appointment: string }>;
}) {
  const { appointment } = await params;

  return <AdminAppointmentShowPage appointmentId={appointment} />;
}
