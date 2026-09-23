"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format, isValid, parseISO, startOfDay } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateFieldProps = {
  value: string
  onChange: (value: string) => void
  id?: string
  min?: string
  max?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

function parseDate(value?: string) {
  if (!value) return undefined

  const date = parseISO(value)
  return isValid(date) ? startOfDay(date) : undefined
}

function DateField({
  value,
  onChange,
  id,
  min,
  max,
  placeholder = "Pick a date",
  className,
  disabled = false,
  required = false,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DateFieldProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = parseDate(value)
  const minDate = parseDate(min)
  const maxDate = parseDate(max)
  const currentYear = new Date().getFullYear()
  const startMonth = minDate ?? new Date(currentYear - 100, 0, 1)
  const endMonth = maxDate ?? new Date(currentYear + 20, 11, 1)

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            aria-required={required}
            data-empty={!selectedDate}
            className={cn(
              "w-full justify-start pr-8 text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate ?? minDate ?? undefined}
            startMonth={startMonth}
            endMonth={endMonth}
            captionLayout="dropdown"
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            onSelect={(date) => {
              if (!date) return
              onChange(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {value && !disabled && (
        <button
          type="button"
          aria-label="Clear date"
          className="absolute right-1 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onChange("")}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export { DateField }
export type { DateFieldProps }
