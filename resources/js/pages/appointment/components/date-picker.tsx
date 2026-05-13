'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

/**
 * DatePickerInput — drop-in replacement for <Input type="date" />
 *
 * Props mirror a standard controlled date input:
 * @param {string}   value        – ISO date string "YYYY-MM-DD" (controlled)
 * @param {function} onChange     – called with a synthetic-like event: { target: { value: "YYYY-MM-DD" } }
 * @param {string}   id           – forwarded to the trigger button for <Label htmlFor>
 * @param {string}   min          – ISO date string; dates before this are disabled  (e.g. todayStr())
 * @param {string}   max          – ISO date string; dates after  this are disabled
 * @param {boolean}  disabled     – disables the picker entirely
 * @param {string}   placeholder  – shown when no date is selected
 * @param {string}   className    – extra classes on the trigger button
 */
export default function DatePicker({
    value = '',
    onChange,
    id,
    min,
    max,
    disabled = false,
    placeholder = 'Pick a date',
    className,
}) {
    const [open, setOpen] = React.useState(false);

    // Parse the controlled value ("YYYY-MM-DD") into a Date object for the calendar
    const selected = React.useMemo(() => {
        if (!value) return undefined;
        const d = parseISO(value);
        return isValid(d) ? d : undefined;
    }, [value]);

    // Convert min/max strings into Date objects for the calendar's disabled prop
    const minDate = React.useMemo(
        () => (min ? parseISO(min) : undefined),
        [min],
    );
    const maxDate = React.useMemo(
        () => (max ? parseISO(max) : undefined),
        [max],
    );

    const handleSelect = (day) => {
        if (!day) return;
        const isoValue = format(day, 'yyyy-MM-dd');
        // Fire a synthetic event so it's a drop-in for onChange={(e) => setData('appointment_date', e.target.value)}
        onChange?.({ target: { value: isoValue } });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    onClick={() => !disabled && setOpen(true)}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !selected && 'text-muted-foreground',
                        disabled && 'cursor-not-allowed opacity-60',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selected ? (
                        format(selected, 'MMMM d, yyyy')
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    disabled={(day) => {
                        if (minDate && day < minDate) return true;
                        if (maxDate && day > maxDate) return true;
                        return false;
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
