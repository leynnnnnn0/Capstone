"use client";

import { useCallback, useEffect, useState } from "react";

import AdminActivityLog from "@/components/admin-appointments/AdminActivityLog";
import AdminAppointmentDetailsCard from "@/components/admin-appointments/AdminAppointmentDetailsCard";
import AdminAppointmentHeader from "@/components/admin-appointments/AdminAppointmentHeader";
import AdminQuotationEditor from "@/components/admin-appointments/AdminQuotationEditor";
import AdminQuotationDetails from "@/components/admin-appointments/AdminQuotationDetails";
import AdminProceedToWorkJob from "@/components/admin-appointments/AdminProceedToWorkJob";
import AdminScheduleForm from "@/components/admin-appointments/AdminScheduleForm";
import AdminStatusActions from "@/components/admin-appointments/AdminStatusActions";
import AppointmentMeasurementRecords from "@/components/ar-measurements/AppointmentMeasurementRecords";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import { DetailPageSkeleton } from "@/components/ui/page-skeletons";
import { fetchAdminAppointment, fetchWorkers } from "@/features/admin-appointments/admin-appointment-api";
import { hasRole } from "@/features/auth/current-user-api";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminAppointment, AdminWorker } from "@/features/admin-appointments/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AdminAppointmentShowPage({ appointmentId }: { appointmentId: string }) {
  const { user } = useCurrentUser();
  const [appointment, setAppointment] = useState<AdminAppointment | null>(null);
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [quotationOpen, setQuotationOpen] = useState(false);

  const reload = useCallback(() => {
    fetchAdminAppointment(appointmentId).then((response) => setAppointment(response.data));
  }, [appointmentId]);

  useRealtimeRefresh((payload) => {
    if (payload.id === Number(appointmentId) || payload.appointment_id === Number(appointmentId)) {
      reload();
    }
  }, ["appointment", "quotation"]);

  useEffect(() => {
    reload();
    fetchWorkers().then((response) => setWorkers(response.data));
  }, [appointmentId, reload]);

  if (!appointment) {
    return <DetailPageSkeleton />;
  }

  const isWorker = hasRole(user, "worker");
  const quotationCanBeDownloaded = ![CustomerStatus.Cancelled, CustomerStatus.NoShow].includes(appointment.status);
  const quotationCanBeSigned = ![CustomerStatus.Cancelled, CustomerStatus.NoShow].includes(appointment.status);

  return (
    <div className="space-y-6">
      <AdminAppointmentHeader
        appointment={appointment}
        onOpenQuotation={() => setQuotationOpen(true)}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminAppointmentDetailsCard appointment={appointment} />
          <CustomerLocationCard
            address={appointment.address}
            addressLat={appointment.address_lat}
            addressLng={appointment.address_lng}
            compact
          />
          <AppointmentMeasurementRecords
            appointmentId={appointment.id}
            appointmentNumber={appointment.appointment_number}
            customerName={appointment.full_name}
            serviceType={appointment.service_type}
            address={appointment.address}
            audience="staff"
          />
        </div>
        <div className="space-y-6">
          {!isWorker && <AdminProceedToWorkJob appointment={appointment} />}
          <AdminStatusActions
            appointment={appointment}
            onUpdated={setAppointment}
          />
          <AdminScheduleForm
            appointment={appointment}
            workers={workers}
            onUpdated={setAppointment}
            readOnly={isWorker}
          />

          <AdminQuotationDetails
            quotation={appointment.quotation}
            canDownload={quotationCanBeDownloaded}
            canSign={quotationCanBeSigned}
          />
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
