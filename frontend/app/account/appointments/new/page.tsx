import AppointmentForm from "@/components/customer/appointments/AppointmentForm";
import CustomerShell from "@/components/customer/shared/CustomerShell";

export default function NewCustomerAppointmentRoute() {
  return (
    <CustomerShell>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">New Appointment</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Book an inspection</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a request with or without quote items. Quote items can still be added through the quote flow.
        </p>
      </div>
      <AppointmentForm />
    </CustomerShell>
  );
}
