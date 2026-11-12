"use client";

import { useCallback, useEffect, useState } from "react";

import AdminDetailTabs from "@/components/admin/AdminDetailTabs";
import AdminActivityLog from "@/components/admin-appointments/AdminActivityLog";
import AdminAppointmentDetailsCard from "@/components/admin-appointments/AdminAppointmentDetailsCard";
import AdminAppointmentHeader from "@/components/admin-appointments/AdminAppointmentHeader";
import AdminQuotationEditor from "@/components/admin-appointments/AdminQuotationEditor";
import AdminQuotationDetails from "@/components/admin-appointments/AdminQuotationDetails";
import AdminProceedToWorkJob from "@/components/admin-appointments/AdminProceedToWorkJob";
import AdminScheduleForm from "@/components/admin-appointments/AdminScheduleForm";
import AdminStatusActions from "@/components/admin-appointments/AdminStatusActions";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import { DetailPageSkeleton } from "@/components/ui/page-skeletons";
import { fetchAdminAppointment, fetchWorkers } from "@/features/admin-appointments/admin-appointment-api";
import { hasRole } from "@/features/auth/current-user-api";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminAppointment, AdminWorker } from "@/features/admin-appointments/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { affectsAppointment } from "@/features/notifications/record-changes";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AdminAppointmentShowPage({ appointmentId }: { appointmentId: string }) {
  const { user } = useCurrentUser();
  const [appointment, setAppointment] = useState<AdminAppointment | null>(null);
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [quotationOpen, setQuotationOpen] = useState(false);

  const reload = useCallback(() => {
    fetchAdminAppointment(appointmentId)
      .then((response) => setAppointment(response.data))
      .catch(() => { /* Keep the last successful snapshot. */ });
  }, [appointmentId]);

  useRealtimeRefresh((payload) => {
    if (affectsAppointment(payload, Number(appointmentId), appointment?.work_job)) reload();
  }, ["appointment", "quotation", "work_job"]);

  useEffect(() => {
    reload();
    fetchWorkers().then((response) => setWorkers(response.data));
  }, [appointmentId, reload]);

  if (!appointment) {
    return <DetailPageSkeleton />;
  }

  const isPending = appointment.status === CustomerStatus.Pending;
  const isWorker = hasRole(user, "staff");
  const quotationCanBeDownloaded = ![CustomerStatus.Cancelled, CustomerStatus.NoShow].includes(appointment.status);
  const quotationCanBeSigned = ![CustomerStatus.Cancelled, CustomerStatus.NoShow].includes(appointment.status);

  return (
    <div className="space-y-6">
      <AdminAppointmentHeader
        appointment={appointment}
        onUpdated={setAppointment}
        quotationOpen={quotationOpen}
        onOpenQuotation={() => setQuotationOpen(true)}
      />
      <AdminDetailTabs
        label="Appointment details"
        attentionTab={isPending ? "schedule" : undefined}
        tabs={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <AdminAppointmentDetailsCard
                  appointment={appointment}
                  action={!isWorker && <AdminProceedToWorkJob appointment={appointment} />}
                />
                <CustomerLocationCard
                  address={appointment.address}
                  addressLat={appointment.address_lat}
                  addressLng={appointment.address_lng}
                  compact
                />
              </div>
            ),
          },
          {
            value: "schedule",
            label: "Schedule",
            content: (
              <AdminScheduleForm
                appointment={appointment}
                workers={workers}
                onUpdated={setAppointment}
                readOnly={isWorker}
              />
            ),
          },
          ...(!isPending ? [{
            value: "status",
            label: "Status",
            content: <AdminStatusActions appointment={appointment} onUpdated={setAppointment} />,
          }] : []),
          {
            value: "quotation",
            label: "Quotation",
            content: (
              <AdminQuotationDetails
                quotation={appointment.quotation}
                canDownload={quotationCanBeDownloaded}
                canSign={quotationCanBeSigned}
                collapsible={false}
              />
            ),
          },
          {
            value: "activity",
            label: "Activity",
            content: <AdminActivityLog remarks={appointment.remarks} />,
          },
        ]}
      />
      <AdminQuotationEditor
        appointment={appointment}
        open={quotationOpen}
        onOpenChange={setQuotationOpen}
        onSaved={reload}
      />
    </div>
  );
}
