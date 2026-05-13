import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
    message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
    if (!message) return null;
    return (
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {message}
        </p>
    );
}
