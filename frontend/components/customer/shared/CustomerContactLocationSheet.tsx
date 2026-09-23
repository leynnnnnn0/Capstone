"use client";

import { Mail, Phone, UserRound } from "lucide-react";

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
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d7e1e8] bg-white px-4 text-sm font-medium text-[#2d425b] shadow-sm transition-colors hover:bg-[#f3f6f8]"
        >
          <UserRound className="size-4" />
          Your details
        </button>
      </SheetTrigger>
      <SheetContent className="w-[calc(100%_-_0.75rem)] max-w-none overflow-y-auto border-l border-[#dce4ea] bg-white p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-[#dce4ea] px-6 py-8 pr-14 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64879a]">
            Your information
          </p>
          <SheetTitle className="mt-3 text-3xl font-semibold tracking-tight text-[#2d425b]">
            Contact &amp; service address
          </SheetTitle>
          <SheetDescription className="mt-3 max-w-md text-sm leading-6 text-[#71869c]">
            Review your contact information and the service location attached to this record.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 px-6 py-8">
          <section className="border-y border-[#dce4ea] py-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">
              Your contact information
            </h2>
            <div className="mt-5 divide-y divide-[#e5ebef]">
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
            embedded
            title="Service location"
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
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef4f7] text-[#64879a]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8194a7]">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-[#2d425b]">{value}</p>
      </div>
    </div>
  );
}
