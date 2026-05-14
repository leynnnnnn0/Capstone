import AppointmentEditPage from "@/components/customer/appointments/AppointmentEditPage";

export default async function CustomerAppointmentEditRoute({
  params,
}: {
  params: Promise<{ appointment: string }>;
}) {
  const { appointment } = await params;

  return <AppointmentEditPage appointmentId={appointment} />;
}
