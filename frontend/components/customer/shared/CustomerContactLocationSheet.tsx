"use client";

import { Mail, MapPinned, Phone, UserRound } from "lucide-react";

import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function CustomerContactLocationSheet({
  fullName,
  phoneNumber,
  email,
  address,
  addressLat,
  addressLng,
}: {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  address: string;
  addressLat?: string | null;
  addressLng?: string | null;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
        >
          <MapPinned className="size-4" />
          Contact &amp; location
        </button>
      </SheetTrigger>
      <SheetContent className="w-[calc(100%_-_0.75rem)] max-w-none overflow-y-auto border-0 bg-[#f3f6f8] p-0 sm:max-w-xl">
        <SheetHeader className="bg-[#162d4a] px-6 py-8 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
            Optional details
          </p>
          <SheetTitle className="mt-2 text-2xl font-medium tracking-[-0.035em] text-white">
            Contact &amp; location
          </SheetTitle>
          <SheetDescription className="mt-2 max-w-md text-sm leading-6 text-white/55">
            Review the contact information and service address attached to this record.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4 sm:p-6">
          <section className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">
              Contact information
            </h2>
            <div className="mt-5 space-y-4">
              <ContactRow icon={UserRound} label="Name" value={fullName} />
              <ContactRow icon={Phone} label="Phone" value={phoneNumber} />
              <ContactRow icon={Mail} label="Email" value={email || "Not provided"} />
            </div>
          </section>

          <CustomerLocationCard
            address={address}
            addressLat={addressLat}
            addressLng={addressLng}
            compact
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2f8] text-[#2c5282]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8ca0b2]">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-[#26384a]">{value}</p>
      </div>
    </div>
  );
}
