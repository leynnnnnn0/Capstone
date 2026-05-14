import AppointmentDetailPage from "@/components/customer/appointments/AppointmentDetailPage";

export default async function CustomerAppointmentRoute({
  params,
}: {
  params: Promise<{ appointment: string }>;
}) {
  const { appointment } = await params;

  return <AppointmentDetailPage appointmentId={appointment} />;
}
