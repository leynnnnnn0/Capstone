type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export const STATUS_COLORS: Record<
    string,
    { bg: string; border: string; text: string; dot: string }
> = {
    pending: {
        bg: 'bg-amber-100',
        border: 'border-amber-400',
        text: 'text-amber-800',
        dot: 'bg-amber-400',
    },
    confirmed: {
        bg: 'bg-primary/10',
        border: 'border-primary',
        text: 'text-primary',
        dot: 'bg-primary',
    },
    cancelled: {
        bg: 'bg-red-100',
        border: 'border-red-400',
        text: 'text-red-700',
        dot: 'bg-red-400',
    },
    completed: {
        bg: 'bg-green-100',
        border: 'border-green-400',
        text: 'text-green-800',
        dot: 'bg-green-400',
    },
    on_the_way: {
        bg: 'bg-blue-100',
        border: 'border-blue-400',
        text: 'text-blue-800',
        dot: 'bg-blue-400',
    },
    on_going: {
        bg: 'bg-purple-100',
        border: 'border-purple-400',
        text: 'text-purple-800',
        dot: 'bg-purple-400',
    },
};
