import AdminAppointmentForm from "@/components/admin-appointments/AdminAppointmentForm";

export default function AdminAppointmentCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Create Appointment</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">New appointment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the customer request first, then confirm the final inspection slot.
        </p>
      </div>
      <AdminAppointmentForm />
    </div>
  );
}
