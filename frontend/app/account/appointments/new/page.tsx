import { Suspense } from "react";

import AppointmentCreatePage from "@/components/customer/appointments/AppointmentCreatePage";

export default function NewCustomerAppointmentRoute() {
  return (
    <Suspense>
      <AppointmentCreatePage />
    </Suspense>
  );
}
