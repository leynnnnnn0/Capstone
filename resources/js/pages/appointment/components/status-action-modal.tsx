import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface StatusActionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    // Header
    icon: ReactNode;
    iconBg: string; // e.g. 'bg-green-100'
    title: string;
    description: ReactNode;

    // Remarks textarea
    remarksLabel?: string;
    remarksPlaceholder?: string;
    remarksValue: string;
    onRemarksChange: (value: string) => void;

    // Footer buttons
    cancelLabel?: string;
    confirmLabel: string;
    confirmClassName?: string;
    confirmVariant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'ghost'
        | 'link'
        | 'secondary';
    processing: boolean;

    onConfirm: () => void;
}

export default function StatusActionModal({
    open,
    onOpenChange,
    icon,
    iconBg,
    title,
    description,
    remarksLabel = 'Remarks',
    remarksPlaceholder = 'Add a remark…',
    remarksValue,
    onRemarksChange,
    cancelLabel = 'Go Back',
    confirmLabel,
    confirmClassName,
    confirmVariant = 'default',
    processing,
    onConfirm,
}: StatusActionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="mb-1 flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}
                        >
                            {icon}
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`modal-remarks-${title}`}>
                        {remarksLabel}{' '}
                        <span className="font-normal text-muted-foreground">
                            (optional)
                        </span>
                    </Label>
                    <Textarea
                        id={`modal-remarks-${title}`}
                        rows={3}
                        placeholder={remarksPlaceholder}
                        value={remarksValue}
                        onChange={(e) => onRemarksChange(e.target.value)}
                        className="resize-none text-sm"
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={processing}
                        variant={confirmVariant}
                        className={confirmClassName}
                    >
                        {processing && (
                            <Loader2 size={14} className="animate-spin" />
                        )}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
