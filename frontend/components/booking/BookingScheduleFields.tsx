"use client";

import { useMemo } from "react";

import FormSelect from "@/components/form/FormSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAvailableTimeOptions,
  minimumBookingDate,
  resolvePreferredTimeForDate,
} from "@/features/booking/booking-utils";
import type { PreferredTime } from "@/features/booking/types";

type BookingScheduleFieldsProps = {
  preferredDate: string;
  preferredTime: PreferredTime;
  dateError?: string;
  timeError?: string;
  className?: string;
  onPreferredDateChange: (date: string, preferredTime: PreferredTime) => void;
  onPreferredTimeChange: (preferredTime: PreferredTime) => void;
};

export default function BookingScheduleFields({
  preferredDate,
  preferredTime,
  dateError,
  timeError,
  className = "grid gap-4 sm:grid-cols-2",
  onPreferredDateChange,
  onPreferredTimeChange,
}: BookingScheduleFieldsProps) {
  const availableTimeOptions = useMemo(() => {
    return getAvailableTimeOptions(preferredDate);
  }, [preferredDate]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="preferred_date">Preferred Date</Label>
        <Input
          id="preferred_date"
          type="date"
          min={minimumBookingDate()}
          value={preferredDate}
          onChange={(event) => {
            const nextDate = event.target.value;
            onPreferredDateChange(
              nextDate,
              resolvePreferredTimeForDate(nextDate, preferredTime),
            );
          }}
        />
        {dateError && <span className="text-xs text-red-500">{dateError}</span>}
      </div>

      <FormSelect
        id="preferred_time"
        label="Preferred Time"
        value={preferredTime}
        options={availableTimeOptions}
        placeholder="Select time"
        error={timeError}
        onValueChange={onPreferredTimeChange}
      />
    </div>
  );
}
