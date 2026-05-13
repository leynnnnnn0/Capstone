import {
    MapPin,
    Phone,
    Mail,
    CalendarDays,
    Clock,
    User,
    Wrench,
    FileText,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    CalendarClock,
    MessageSquare,
    RotateCcw,
} from 'lucide-react';

export default function AppointmentDetails({ appointment }: any) {
    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-5 text-xs font-semibold tracking-widest text-primary uppercase">
                Appointment Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
                <Detail icon={<User size={14} />} label="Customer">
                    {appointment.full_name}
                </Detail>
                <Detail icon={<Phone size={14} />} label="Phone">
                    {appointment.phone_number}
                </Detail>
                <Detail icon={<Mail size={14} />} label="Email">
                    {appointment.email || '—'}
                </Detail>
                <Detail icon={<Wrench size={14} />} label="Service Type">
                    <span className="capitalize">
                        {appointment.service_type}
                    </span>
                    {appointment.service_type_other && (
                        <span className="ml-1 text-muted-foreground">
                            ({appointment.service_type_other})
                        </span>
                    )}
                </Detail>
                <Detail
                    icon={<CalendarDays size={14} />}
                    label="Preferred Date"
                >
                    {appointment.preferred_date_formatted}
                </Detail>
                <Detail icon={<Clock size={14} />} label="Preferred Time">
                    {appointment.preferred_time}
                </Detail>
                {appointment.additional_notes && (
                    <div className="sm:col-span-2">
                        <Detail icon={<FileText size={14} />} label="Notes">
                            {appointment.additional_notes}
                        </Detail>
                    </div>
                )}
            </div>
        </div>
    );
}

function Detail({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {icon} {label}
            </div>
            <p className="text-sm text-foreground">{children}</p>
        </div>
    );
}
