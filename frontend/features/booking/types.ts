export type PreferredTime = "morning" | "afternoon";

export type BookingForm = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  address: string;
  address_pinned: string;
  address_lat: string;
  address_lng: string;
  preferred_date: string;
  preferred_time: PreferredTime;
  service_type: "quotation";
  service_type_other: string;
  additional_notes: string;
  consent: boolean;
};

export type BookingFormErrors = Partial<
  Record<keyof BookingForm | "rate_limit" | "form", string>
>;

export type BookingTimeOption = {
  label: string;
  value: PreferredTime;
};

export type LocationValue = {
  address: string;
  pinned: string;
  lat: number;
  lng: number;
};
