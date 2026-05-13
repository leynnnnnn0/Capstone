import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import Header from './components/header';
import AppointmentDetails from './components/appointment-details';
import LocationCard from './components/location-card';
import ScheduleForm from './components/schedule-form';
import ActivityLog from './components/activity-log';
import StatusActions from './components/status-actions';
import QuotationForm from './components/quotation-form';
import QuotationDetails from './components/quotation-details';
import ProceedToWorkJob from './components/proceed-to-work-job';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/appointments' },
    { title: 'Appointment Details', href: '#' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Worker {
    id: number;
    full_name: string;
}

interface Remark {
    id: number;
    action:
        | 'confirmed'
        | 'rescheduled'
        | 'completed'
        | 'cancelled'
        | 'reopened'
        | 'on_the_way'
        | 'on_going';
    message: string | null;
    created_at: string;
    user: { id: number; full_name: string };
}

interface Appointment {
    id: number;
    appointment_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
    email: string;
    address: string;
    address_pinned: string;
    address_lat: string;
    address_lng: string;
    preferred_date: string;
    preferred_date_formatted: string;
    preferred_time: string;
    service_type: string;
    service_type_other: string;
    additional_notes: string;
    appointment_date: string | null;
    appointment_time_from: string | null;
    appointment_time_until: string | null;
    status:
        | 'pending'
        | 'confirmed'
        | 'on_the_way'
        | 'on_going'
        | 'completed'
        | 'cancelled';
    consent: boolean;
    consent_given_at: string | null;
}

interface ProductOption {
    id: number;
    name: string;
    price_modifier: number | string;
    is_active: boolean;
}

interface ProductOptionGroup {
    id: number;
    name: string;
    is_required: boolean;
    product_options: ProductOption[];
}

interface ProductVariant {
    id: number;
    width: number;
    height: number;
    price: number;
}

interface Product {
    id: number;
    name: string;
    unit: string;
    price_per_unit: number;
    product_variants: ProductVariant[];
    product_option_groups: ProductOptionGroup[];
}

interface QuotationItemOption {
    id: number;
    group_name: string;
    option_name: string;
    price_modifier: number | string;
    product_option_group_id: number;
    product_option_id: number;
}

interface QuotationItem {
    id: number;
    name: string;
    description: string | null;
    width: number | null;
    height: number | null;
    thickness: number | null;
    pieces: number;
    amount_per_piece: number | string;
    options_amount: number | string;
    total_amount: number | string;
    notes: string | null;
    status: string;
    product_id: number;
    quotation_item_options: QuotationItemOption[];
}

interface Quotation {
    id: number;
    notes: string | null;
    created_at: string;
    quotation_items: QuotationItem[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Show({
    appointment,
    workers = [],
    assigned_worker_ids = [],
    remarks = [],
    appointments,
    workersSchedule,
    products = [],
    quotation = null,
}: {
    appointment: Appointment;
    workers: Worker[];
    assigned_worker_ids: number[];
    remarks: Remark[];
    appointments: any;
    workersSchedule: any;
    products: Product[];
    quotation: Quotation | null;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointment Details" />

            <div className="space-y-6">
                <Header
                    appointment={appointment}
                    appointments={appointments}
                    workers={workersSchedule}
                    products={products}
                    quotation={quotation}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* ── Left column ── */}
                    <div className="space-y-6 lg:col-span-2">
                        <AppointmentDetails appointment={appointment} />
                        <LocationCard appointment={appointment} />
                    </div>

                    {/* ── Right column ── */}
                    <div className="space-y-6">
                        <StatusActions appointment={appointment} />

                        <ScheduleForm
                            appointment={appointment}
                            workers={workers}
                            assigned_worker_ids={assigned_worker_ids}
                        />

                        {quotation && (
                            <QuotationDetails quotation={quotation} />
                        )}


                        <ActivityLog remarks={remarks} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
