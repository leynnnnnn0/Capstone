import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Briefcase, ExternalLink } from 'lucide-react';

interface Props {
    appointmentId: number;
    appointmentStatus: string;
    existingWorkJobId?: number | null;
}

/**
 * Shows a "Proceed to Work Job" button on the appointment detail page.
 * Only visible when the appointment is completed.
 * If a work job already exists for this appointment, links to it instead.
 */
export default function ProceedToWorkJob({
    appointmentId,
    appointmentStatus,
    existingWorkJobId,
}: Props) {
    // Only makes sense to create a work job once the appointment is done
    if (appointmentStatus !== 'completed') return null;

    if (existingWorkJobId) {
        return (
            <Link href={`/work-jobs/${existingWorkJobId}`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50"
                >
                    <ExternalLink size={14} />
                    View Work Job
                </Button>
            </Link>
        );
    }

    return (
        <Link href={`/appointments/${appointmentId}/work-job`}>
            <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
                <Briefcase size={14} />
                Proceed to Work Job
            </Button>
        </Link>
    );
}
