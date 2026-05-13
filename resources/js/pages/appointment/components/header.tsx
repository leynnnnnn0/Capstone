import { Badge } from '@/components/ui/badge';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-primary/10 text-primary',
    cancelled: 'bg-red-100 text-red-600',
    completed: 'bg-green-100 text-green-700',
};

import Calendar from '@/pages/calendar/Calendar';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import QuotationForm from './quotation-form';
import ProceedToWorkJob from './proceed-to-work-job';

interface AppointmentData {
    id: number;
    appointment_number: string;
    full_name: string;
    date: string;
    time_from: string;
    time_until: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

const FAKE_APPOINTMENTS: AppointmentData[] = [
    {
        id: 1,
        appointment_number: 'APT-1234',
        full_name: 'Juan dela Cruz',
        date: '2026-03-29',
        time_from: '06:00',
        time_until: '09:00',
        status: 'confirmed',
    },
    {
        id: 2,
        appointment_number: 'APT-5678',
        full_name: 'Maria Santos',
        date: '2026-03-29',
        time_from: '06:00',
        time_until: '09:00',
        status: 'pending',
    },
    {
        id: 3,
        appointment_number: 'APT-9999',
        full_name: 'Lito Reyes',
        date: '2026-03-29',
        time_from: '06:00',
        time_until: '08:00',
        status: 'completed',
    },
    {
        id: 4,
        appointment_number: 'APT-9012',
        full_name: 'Pedro Reyes',
        date: '2026-03-30',
        time_from: '09:00',
        time_until: '11:00',
        status: 'confirmed',
    },
    {
        id: 5,
        appointment_number: 'APT-3456',
        full_name: 'Ana Garcia',
        date: '2026-03-30',
        time_from: '09:00',
        time_until: '10:00',
        status: 'pending',
    },
    {
        id: 6,
        appointment_number: 'APT-7890',
        full_name: 'Carlos Mendoza',
        date: '2026-04-01',
        time_from: '08:00',
        time_until: '10:00',
        status: 'pending',
    },
    {
        id: 7,
        appointment_number: 'APT-2345',
        full_name: 'Rosa Lim',
        date: '2026-04-02',
        time_from: '10:00',
        time_until: '12:00',
        status: 'confirmed',
    },
];

export default function Header({ appointment, appointments, workers, products, quotation }: any) {
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                    {appointment.appointment_number}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-foreground">
                    {appointment.full_name}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <Badge
                    className={`capitalize ${STATUS_STYLES[appointment.status] ?? 'bg-muted text-muted-foreground'}`}
                >
                    {appointment.status}
                </Badge>

                <Drawer direction="left">
                    <DrawerTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCalendarModal(true)}
                        >
                            <CalendarDays size={14} />
                            Open Calendar
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent
                        style={{ width: '1000px', maxWidth: '90vw' }}
                    >
                        <DrawerHeader>
                            <DrawerTitle>Calendar</DrawerTitle>
                            <DrawerDescription>
                                Appointments Overview
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-5">
                            <Calendar
                                appointments={appointments}
                                workers={workers}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>

                <QuotationForm
                    appointmentId={appointment.id}
                    products={products}
                    existingQuotation={quotation}
                />


                                        <ProceedToWorkJob
                                            appointmentId={appointment.id}
                                            appointmentStatus={appointment.status}
                                        />
            </div>
        </div>
    );
}
