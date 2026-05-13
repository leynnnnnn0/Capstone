import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/appointments' },
    { title: 'Create Appointment', href: '#' },
];


export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointment Details" />
        </AppLayout>
    );
}
