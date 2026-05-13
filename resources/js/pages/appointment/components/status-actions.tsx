import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    RotateCcw,
    Truck,
    Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusActionModal from './status-action-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'on_the_way'
    | 'on_going'
    | 'completed'
    | 'cancelled';

interface Appointment {
    id: number;
    appointment_number: string;
    full_name: string;
    status: AppointmentStatus;
}

// ─── Status flow config ───────────────────────────────────────────────────────
//
//  confirmed → on_the_way → on_going → completed
//  cancel allowed only on: confirmed, on_the_way
//  reopen allowed only on: cancelled

const STATUS_FLOW: AppointmentStatus[] = [
    'confirmed',
    'on_the_way',
    'on_going',
    'completed',
];

const CANCELLABLE_STATUSES: AppointmentStatus[] = ['confirmed', 'on_the_way'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextStatus(current: AppointmentStatus): AppointmentStatus | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
}

function nextStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
        pending: 'Pending',
        confirmed: 'On the Way',
        on_the_way: 'On Going',
        on_going: 'Completed',
        completed: 'Completed',
        cancelled: 'Cancelled',
    };
    return labels[status];
}

function nextStatusRoute(id: number, next: AppointmentStatus): string {
    const routes: Partial<Record<AppointmentStatus, string>> = {
        on_the_way: `/appointments/${id}/on-the-way`,
        on_going: `/appointments/${id}/on-going`,
        completed: `/appointments/${id}/complete`,
    };
    return routes[next] ?? `/appointments/${id}/advance`;
}

function nextStatusIcon(next: AppointmentStatus) {
    if (next === 'on_the_way') return <Truck size={14} />;
    if (next === 'on_going') return <Wrench size={14} />;
    if (next === 'completed') return <CheckCircle2 size={14} />;
    return <CheckCircle2 size={14} />;
}

function nextStatusColors(next: AppointmentStatus) {
    if (next === 'on_the_way')
        return 'border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800';
    if (next === 'on_going')
        return 'border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800';
    if (next === 'completed')
        return 'border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50 hover:text-green-800';
    return '';
}

function nextStatusModalMeta(next: AppointmentStatus) {
    if (next === 'on_the_way') {
        return {
            iconBg: 'bg-blue-100',
            icon: <Truck size={20} className="text-blue-600" />,
            title: 'Mark as On the Way?',
            placeholder: 'e.g. Worker is heading to the location…',
            confirmLabel: 'Yes, On the Way',
            confirmClassName: 'bg-blue-600 text-white hover:bg-blue-700',
        };
    }
    if (next === 'on_going') {
        return {
            iconBg: 'bg-amber-100',
            icon: <Wrench size={20} className="text-amber-600" />,
            title: 'Mark as On Going?',
            placeholder: 'e.g. Worker has arrived and started the job…',
            confirmLabel: 'Yes, Mark On Going',
            confirmClassName: 'bg-amber-600 text-white hover:bg-amber-700',
        };
    }
    return {
        iconBg: 'bg-green-100',
        icon: <CheckCircle2 size={20} className="text-green-600" />,
        title: 'Mark as Completed?',
        placeholder: 'e.g. Job completed successfully. Customer satisfied…',
        confirmLabel: 'Yes, Mark Completed',
        confirmClassName: 'bg-green-600 text-white hover:bg-green-700',
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatusActions({
    appointment,
}: {
    appointment: Appointment;
}) {
    const { status } = appointment;

    const nextStatus = getNextStatus(status);
    const canAdvance = nextStatus !== null;
    const canCancel = CANCELLABLE_STATUSES.includes(status);
    const isCancelled = status === 'cancelled';
    const isCompleted = status === 'completed';

    // ── Advance form ──────────────────────────────────────────────────────────
    const {
        data: advanceData,
        setData: setAdvanceData,
        put: putAdvance,
        processing: advancing,
    } = useForm({ remarks: '' });

    const [showAdvanceModal, setShowAdvanceModal] = useState(false);

    const handleAdvance = () => {
        if (!nextStatus) return;
        setShowAdvanceModal(false);
        putAdvance(nextStatusRoute(appointment.id, nextStatus));
    };

    // ── Cancel form ───────────────────────────────────────────────────────────
    const {
        data: cancelData,
        setData: setCancelData,
        put: putCancel,
        processing: cancelling,
    } = useForm({ remarks: '' });

    const [showCancelModal, setShowCancelModal] = useState(false);

    const handleCancel = () => {
        setShowCancelModal(false);
        putCancel(`/appointments/${appointment.id}/cancel`);
    };

    // ── Reopen form ───────────────────────────────────────────────────────────
    const {
        data: reopenData,
        setData: setReopenData,
        put: putReopen,
        processing: reopening,
    } = useForm({ remarks: '' });

    const [showReopenModal, setShowReopenModal] = useState(false);

    const handleReopen = () => {
        setShowReopenModal(false);
        putReopen(`/appointments/${appointment.id}/reopen`);
    };


   

    // ── Nothing to show for completed ─────────────────────────────────────────
    if (isCompleted) return null;

    const advanceMeta = nextStatus ? nextStatusModalMeta(nextStatus) : null;

    return (
        <>
            {/* ── Actionable statuses panel ───────────────────────────────── */}
            {(canAdvance || canCancel) && (
                <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div>
                        <h2 className="text-xs font-semibold tracking-widest text-primary uppercase">
                            Update Status
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Advance this appointment through the workflow, or
                            cancel it if it won't push through.
                        </p>
                    </div>

                    {/* ── Status flow indicator ───────────────────────────── */}
                    <StatusFlowIndicator current={status} />

                    <div className="flex flex-col gap-2.5">
                        {/* Advance button */}
                        {canAdvance && nextStatus && (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={advancing}
                                onClick={() => setShowAdvanceModal(true)}
                                className={`w-full ${nextStatusColors(nextStatus)}`}
                            >
                                {advancing ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    nextStatusIcon(nextStatus)
                                )}
                                Mark as {nextStatusLabel(status)}
                            </Button>
                        )}

                        {/* Cancel button */}
                        {canCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={cancelling}
                                onClick={() => setShowCancelModal(true)}
                                className="w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            >
                                {cancelling ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <XCircle size={14} />
                                )}
                                Cancel Appointment
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Cancelled panel ─────────────────────────────────────────── */}
            {isCancelled && (
                <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-xs font-semibold tracking-widest text-primary uppercase">
                        Reopen Appointment
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        This appointment was cancelled. You can reopen it to set
                        it back to pending and reschedule.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={reopening}
                        onClick={() => setShowReopenModal(true)}
                        className="w-full border-sky-200 text-sky-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                    >
                        {reopening ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <RotateCcw size={14} />
                        )}
                        Reopen Appointment
                    </Button>
                </div>
            )}

            {/* ── Modals ──────────────────────────────────────────────────── */}

            {/* Advance modal */}
            {advanceMeta && nextStatus && (
                <StatusActionModal
                    open={showAdvanceModal}
                    onOpenChange={setShowAdvanceModal}
                    icon={advanceMeta.icon}
                    iconBg={advanceMeta.iconBg}
                    title={advanceMeta.title}
                    description={
                        <>
                            This will advance{' '}
                            <span className="font-semibold text-foreground">
                                {appointment.appointment_number}
                            </span>{' '}
                            for{' '}
                            <span className="font-semibold text-foreground">
                                {appointment.full_name}
                            </span>{' '}
                            to{' '}
                            <span className="font-semibold text-foreground">
                                {nextStatusLabel(status)}
                            </span>
                            .
                        </>
                    }
                    remarksPlaceholder={advanceMeta.placeholder}
                    remarksValue={advanceData.remarks}
                    onRemarksChange={(v) => setAdvanceData('remarks', v)}
                    confirmLabel={advanceMeta.confirmLabel}
                    confirmClassName={advanceMeta.confirmClassName}
                    processing={advancing}
                    onConfirm={handleAdvance}
                />
            )}

            {/* Cancel modal */}
            <StatusActionModal
                open={showCancelModal}
                onOpenChange={setShowCancelModal}
                icon={<AlertTriangle size={20} className="text-red-600" />}
                iconBg="bg-red-100"
                title="Cancel Appointment?"
                description={
                    <>
                        You're about to cancel{' '}
                        <span className="font-semibold text-foreground">
                            {appointment.appointment_number}
                        </span>{' '}
                        for{' '}
                        <span className="font-semibold text-foreground">
                            {appointment.full_name}
                        </span>
                        . This action cannot be undone.
                    </>
                }
                remarksLabel="Reason for cancellation"
                remarksPlaceholder="e.g. Customer requested cancellation due to schedule conflict…"
                remarksValue={cancelData.remarks}
                onRemarksChange={(v) => setCancelData('remarks', v)}
                confirmLabel="Yes, Cancel It"
                confirmVariant="destructive"
                processing={cancelling}
                onConfirm={handleCancel}
            />

            {/* Reopen modal */}
            <StatusActionModal
                open={showReopenModal}
                onOpenChange={setShowReopenModal}
                icon={<RotateCcw size={20} className="text-sky-600" />}
                iconBg="bg-sky-100"
                title="Reopen Appointment?"
                description={
                    <>
                        This will reopen{' '}
                        <span className="font-semibold text-foreground">
                            {appointment.appointment_number}
                        </span>{' '}
                        for{' '}
                        <span className="font-semibold text-foreground">
                            {appointment.full_name}
                        </span>{' '}
                        and set it back to{' '}
                        <span className="font-semibold text-foreground">
                            pending
                        </span>{' '}
                        so you can reschedule.
                    </>
                }
                remarksPlaceholder="e.g. Customer requested to reopen the appointment…"
                remarksValue={reopenData.remarks}
                onRemarksChange={(v) => setReopenData('remarks', v)}
                confirmLabel="Yes, Reopen It"
                confirmClassName="bg-sky-600 text-white hover:bg-sky-700"
                processing={reopening}
                onConfirm={handleReopen}
            />
        </>
    );
}

// ─── Status flow indicator ────────────────────────────────────────────────────

const FLOW_STEPS: { status: AppointmentStatus; label: string }[] = [
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'on_the_way', label: 'On the Way' },
    { status: 'on_going', label: 'On Going' },
    { status: 'completed', label: 'Completed' },
];

function StatusFlowIndicator({ current }: { current: AppointmentStatus }) {
    const currentIdx = FLOW_STEPS.findIndex((s) => s.status === current);

    return (
        <div className="flex items-center gap-1">
            {FLOW_STEPS.map((step, idx) => {
                const isDone = idx < currentIdx;
                const isActive = idx === currentIdx;
                const isFuture = idx > currentIdx;

                return (
                    <div
                        key={step.status}
                        className="flex flex-1 flex-col items-center gap-1"
                    >
                        <div className="flex w-full items-center">
                            {/* Left connector */}
                            <div
                                className={`h-0.5 flex-1 ${idx === 0 ? 'invisible' : isDone || isActive ? 'bg-primary' : 'bg-muted'}`}
                            />
                            {/* Dot */}
                            <div
                                className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors ${
                                    isActive
                                        ? 'border-primary bg-primary'
                                        : isDone
                                          ? 'border-primary bg-primary opacity-40'
                                          : 'border-muted bg-background'
                                }`}
                            />
                            {/* Right connector */}
                            <div
                                className={`h-0.5 flex-1 ${idx === FLOW_STEPS.length - 1 ? 'invisible' : isDone ? 'bg-primary opacity-40' : 'bg-muted'}`}
                            />
                        </div>
                        <span
                            className={`text-center text-[10px] leading-tight ${
                                isActive
                                    ? 'font-semibold text-primary'
                                    : isDone
                                      ? 'text-muted-foreground'
                                      : isFuture
                                        ? 'text-muted-foreground/50'
                                        : ''
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
