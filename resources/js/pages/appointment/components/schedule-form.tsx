import { useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    CalendarClock,
    MessageSquare,
    RotateCcw,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/multi-select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import DatePicker from './date-picker';

interface SlotFields {
    appointment_date: string;
    appointment_time_from: string;
    appointment_time_until: string;
    worker_ids: number[];
}
interface Worker {
    id: number;
    full_name: string;
}

export default function ScheduleForm({
    appointment,
    workers,
    assigned_worker_ids = [],
}: {
    appointment: any;
    workers: Worker[];
    assigned_worker_ids: number[];
}) {
    const [availableWorkers, setAvailableWorkers] = useState<Worker[]>(workers);
    const fetchAvailableWorkers = async (
        date: string,
        from: string,
        to: string,
    ) => {
        if (!date || !from || !to) return;

        const res = await axios.get('/get-available-workers', {
            params: {
                appointment_id: appointment.id,
                appointment_date: date,
                appointment_time_from: from,
                appointment_time_until: to,
            },
        });
        setAvailableWorkers(res.data);
    };
    const [clientErrors, setClientErrors] = useState<Record<string, string>>(
        {},
    );

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [editingSlot, setEditingSlot] = useState(false);

    /** "YYYY-MM-DD" of today in local time */
    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    /** "HH:mm" of current time */
    function nowTimeStr() {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    /** Compare two "HH:mm" strings — returns -1 | 0 | 1 */
    function cmpTime(a: string, b: string) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    function formatTime(t: string) {
        if (!t) return t;
        const [h, m] = t.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, '0')} ${period}`;
    }

    function formatDate(d: string) {
        if (!d) return d;
        const [year, month, day] = d.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function validateSlot(fields: SlotFields): Record<string, string> {
        const errs: Record<string, string> = {};
        const today = todayStr();
        const now = nowTimeStr();
        const isToday = fields.appointment_date === today;

        if (!fields.appointment_date) {
            errs.appointment_date = 'Appointment date is required.';
        } else if (fields.appointment_date < today) {
            errs.appointment_date =
                'Appointment date must be today or a future date.';
        }

        if (!fields.appointment_time_from) {
            errs.appointment_time_from = 'Start time is required.';
        } else if (isToday && cmpTime(fields.appointment_time_from, now) < 0) {
            errs.appointment_time_from =
                "Start time must be now or later for today's appointments.";
        }

        if (!fields.appointment_time_until) {
            errs.appointment_time_until = 'End time is required.';
        } else if (
            fields.appointment_time_from &&
            cmpTime(
                fields.appointment_time_until,
                fields.appointment_time_from,
            ) <= 0
        ) {
            errs.appointment_time_until =
                'End time must be after the start time.';
        }

        if (!fields.worker_ids.length) {
            errs.worker_ids =
                'Please assign at least one worker to the appointment.';
        }

        return errs;
    }

    const {
        data,
        setData,
        put,
        processing,
        errors: serverErrors,
    } = useForm({
        worker_ids: assigned_worker_ids,
        appointment_date: appointment.appointment_date ?? '',
        appointment_time_from: appointment.appointment_time_from ?? '',
        appointment_time_until: appointment.appointment_time_until ?? '',
        status: 'confirmed',
        remarks: '',
    });

    const handleConfirmClick = (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validateSlot(data);
        if (Object.keys(errs).length) {
            setClientErrors(errs);
            return;
        }
        setClientErrors({});
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = () => {
        setShowConfirmModal(false);
        put(`/appointments/${appointment.id}/confirm`);
        setEditingSlot(false);
        setData('remarks', '');
    };

    const handleCancelReschedule = () => {
        setData({
            worker_ids: assigned_worker_ids,
            appointment_date: appointment.appointment_date ?? '',
            appointment_time_from: appointment.appointment_time_from ?? '',
            appointment_time_until: appointment.appointment_time_until ?? '',
            status: 'confirmed',
            remarks: '',
        });
        setClientErrors({});
        setEditingSlot(false);
    };

    const options = availableWorkers.map((w) => ({
        label: w.full_name,
        value: String(w.id),
    }));

    const selectedWorkerNames = data.worker_ids
        .map((id) => workers.find((w) => w.id === id)?.full_name)
        .filter(Boolean) as string[];

    const errors = { ...clientErrors, ...serverErrors };

    const canResceduleStatuses = ['confirmed', 'on_the_way', 'on_going'];
    const canReschedule = canResceduleStatuses.includes(appointment.status);

    const slotReadOnly = !editingSlot && appointment.status !== 'pending';

    const isActionable = appointment.status == 'pending' || editingSlot;

    return (
        <>
            <form
                onSubmit={handleConfirmClick}
                className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold tracking-widest text-primary uppercase">
                        {appointment.status === 'pending'
                            ? 'Schedule Appointment'
                            : 'Appointment Slot'}
                    </h2>
                    {/* "Reschedule" trigger for confirmed appointments */}
                    {!editingSlot && canReschedule && (
                        <button
                            type="button"
                            onClick={() => setEditingSlot(true)}
                            className="text-[11px] font-semibold text-primary hover:underline"
                        >
                            Reschedule
                        </button>
                    )}
                </div>

                {/* Appointment Date */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="appointment_date">Appointment Date</Label>
                    <DatePicker
                        id="appointment_date"
                        min={todayStr()}
                        value={data.appointment_date}
                        disabled={slotReadOnly}
                        onChange={(e) => {
                            setData('appointment_date', e.target.value);
                            fetchAvailableWorkers(
                                e.target.value,
                                data.appointment_time_from,
                                data.appointment_time_until,
                            );
                            setClientErrors((prev) => {
                                const n = { ...prev };
                                delete n.appointment_date;
                                return n;
                            });
                        }}
                        className={
                            slotReadOnly ? 'cursor-not-allowed opacity-60' : ''
                        }
                    />
                    {errors.appointment_date && (
                        <span className="text-xs text-red-500">
                            {errors.appointment_date}
                        </span>
                    )}
                </div>

                {/* Time From / Until */}
                <div className="flex flex-col gap-1.5">
                    <Label>Appointment Time</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-muted-foreground">
                                From
                            </span>
                            <Input
                                type="time"
                                value={data.appointment_time_from}
                                disabled={slotReadOnly}
                                onChange={(e) => {
                                    setData(
                                        'appointment_time_from',
                                        e.target.value,
                                    );
                                    fetchAvailableWorkers(
                                        data.appointment_date,
                                        e.target.value,
                                        data.appointment_time_until,
                                    );
                                    setClientErrors((prev) => {
                                        const n = { ...prev };
                                        delete n.appointment_time_from;
                                        return n;
                                    });
                                }}
                                className={
                                    slotReadOnly
                                        ? 'cursor-not-allowed opacity-60'
                                        : ''
                                }
                            />
                            {errors.appointment_time_from && (
                                <span className="text-xs text-red-500">
                                    {errors.appointment_time_from}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-muted-foreground">
                                Until
                            </span>
                            <Input
                                type="time"
                                value={data.appointment_time_until}
                                disabled={slotReadOnly}
                                onChange={(e) => {
                                    setData(
                                        'appointment_time_until',
                                        e.target.value,
                                    );
                                    fetchAvailableWorkers(
                                        data.appointment_date,
                                        data.appointment_time_from,
                                        e.target.value,
                                    );
                                    setClientErrors((prev) => {
                                        const n = { ...prev };
                                        delete n.appointment_time_until;
                                        return n;
                                    });
                                }}
                                className={
                                    slotReadOnly
                                        ? 'cursor-not-allowed opacity-60'
                                        : ''
                                }
                            />
                            {errors.appointment_time_until && (
                                <span className="text-xs text-red-500">
                                    {errors.appointment_time_until}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Assign Workers */}
                <div className="flex flex-col gap-1.5">
                    <Label>
                        {appointment.status === 'pending'
                            ? 'Assign'
                            : 'Assigned'}{' '}
                        Workers
                    </Label>
                    <MultiSelect
                        defaultValue={data.worker_ids.map(String)}
                        options={options}
                        disabled={slotReadOnly}
                        onValueChange={(values) => {
                            setData('worker_ids', values.map(Number));
                            setClientErrors((prev) => {
                                const n = { ...prev };
                                delete n.worker_ids;
                                return n;
                            });
                        }}
                    />
                    {errors.worker_ids && (
                        <span className="text-xs text-red-500">
                            {errors.worker_ids}
                        </span>
                    )}
                </div>

                {/* Actions — only shown when editing/pending */}
                {isActionable && (
                    <div
                        className={`flex gap-2 pt-1 ${canReschedule ? 'flex-row' : ''}`}
                    >
                        {/* Cancel reschedule — only for confirmed appointments in edit mode */}
                        {canReschedule && editingSlot && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelReschedule}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        )}
                        {isActionable && (
                            <Button
                                type="submit"
                                disabled={processing}
                                className={`bg-primary text-primary-foreground hover:bg-primary/90 ${canReschedule && editingSlot ? 'flex-1' : 'w-full'}`}
                            >
                                {processing ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <CheckCircle2 size={14} />
                                )}
                                {appointment.status === 'pending'
                                    ? 'Confirm Slot'
                                    : 'Save Reschedule'}
                            </Button>
                        )}
                    </div>
                )}
            </form>

            {/* ── Modal: Confirm / Reschedule Slot ───────────────────────────────── */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {appointment.status === 'pending'
                                ? 'Confirm Appointment Slot'
                                : 'Reschedule Appointment'}
                        </DialogTitle>
                        <DialogDescription>
                            Please review the details below before{' '}
                            {appointment.status === 'pending'
                                ? 'confirming'
                                : 'rescheduling'}
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
                        <ModalRow
                            label="Customer"
                            value={appointment.full_name}
                        />
                        <ModalRow
                            label="Date"
                            value={
                                data.appointment_date
                                    ? formatDate(data.appointment_date)
                                    : '—'
                            }
                        />
                        <ModalRow
                            label="Time"
                            value={
                                data.appointment_time_from &&
                                data.appointment_time_until
                                    ? `${formatTime(data.appointment_time_from)} – ${formatTime(data.appointment_time_until)}`
                                    : data.appointment_time_from
                                      ? formatTime(data.appointment_time_from)
                                      : '—'
                            }
                        />
                        <ModalRow
                            label="Workers"
                            value={
                                selectedWorkerNames.length > 0
                                    ? selectedWorkerNames.join(', ')
                                    : '—'
                            }
                        />
                        <ModalRow
                            label="Status"
                            value="Confirmed"
                            valueClassName="text-primary font-semibold"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="confirm-remarks">
                            Remarks{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <Textarea
                            id="confirm-remarks"
                            rows={3}
                            placeholder={
                                appointment.status === 'pending'
                                    ? 'e.g. Slot confirmed as per customer request…'
                                    : 'e.g. Rescheduled due to technician unavailability…'
                            }
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            className="resize-none text-sm"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmModal(false)}
                        >
                            Go Back
                        </Button>
                        <Button
                            onClick={handleConfirmSubmit}
                            disabled={processing}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {processing && (
                                <Loader2 size={14} className="animate-spin" />
                            )}
                            {appointment.status === 'pending'
                                ? 'Yes, Confirm'
                                : 'Yes, Reschedule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ModalRow({
    label,
    value,
    valueClassName = '',
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="flex items-center justify-between bg-card px-4 py-3">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <span
                className={`text-right text-sm text-foreground ${valueClassName}`}
            >
                {value}
            </span>
        </div>
    );
}
