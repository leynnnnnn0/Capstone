"use client";

import { useEffect, useState } from "react";

import AdminActivityLog from "@/components/admin-appointments/AdminActivityLog";
import AdminAppointmentDetailsCard from "@/components/admin-appointments/AdminAppointmentDetailsCard";
import AdminAppointmentHeader from "@/components/admin-appointments/AdminAppointmentHeader";
import AdminQuotationEditor from "@/components/admin-appointments/AdminQuotationEditor";
import AdminQuotationDetails from "@/components/admin-appointments/AdminQuotationDetails";
import AdminProceedToWorkJob from "@/components/admin-appointments/AdminProceedToWorkJob";
import AdminScheduleForm from "@/components/admin-appointments/AdminScheduleForm";
import AdminStatusActions from "@/components/admin-appointments/AdminStatusActions";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import { fetchAdminAppointment, fetchWorkers } from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment, AdminWorker } from "@/features/admin-appointments/types";

export default function AdminAppointmentShowPage({ appointmentId }: { appointmentId: string }) {
  const [appointment, setAppointment] = useState<AdminAppointment | null>(null);
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [quotationOpen, setQuotationOpen] = useState(false);

  function reload() {
    fetchAdminAppointment(appointmentId).then((response) => setAppointment(response.data));
  }

  useEffect(() => {
    reload();
    fetchWorkers().then((response) => setWorkers(response.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  if (!appointment) {
    return <p className="text-sm text-muted-foreground">Loading appointment...</p>;
  }

  return (
    <div className="space-y-6">
      <AdminAppointmentHeader appointment={appointment} onOpenQuotation={() => setQuotationOpen(true)} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminAppointmentDetailsCard appointment={appointment} />
          <CustomerLocationCard address={appointment.address} addressLat={appointment.address_lat} addressLng={appointment.address_lng} compact />
        </div>
        <div className="space-y-6">
          <AdminStatusActions appointment={appointment} onUpdated={setAppointment} />
          <AdminScheduleForm appointment={appointment} workers={workers} onUpdated={setAppointment} />
          <AdminProceedToWorkJob appointment={appointment} />
          <AdminQuotationDetails quotation={appointment.quotation} />
          <AdminActivityLog remarks={appointment.remarks} />
        </div>
      </div>
      <AdminQuotationEditor
        appointment={appointment}
        open={quotationOpen}
        onOpenChange={setQuotationOpen}
        onSaved={reload}
      />
    </div>
  );
}
