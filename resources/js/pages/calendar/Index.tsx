import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import Calendar from './Calendar';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Calendar', href: '/calendar' },
];

interface Appointment {
    id: number;
    appointment_number: string;
    full_name: string;
    date: string;
    time_from: string;
    time_until: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

const FAKE_APPOINTMENTS: Appointment[] = [
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



export default function Index({
    appointments = FAKE_APPOINTMENTS,
    workers
}: {
        appointments?: Appointment[];
        workers: any;
}) {


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <Calendar appointments={appointments} workers={workers}/>
        </AppLayout>
    );
}
