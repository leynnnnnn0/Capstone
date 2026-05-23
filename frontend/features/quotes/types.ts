import type { Product, ProductOption, ProductOptionGroup, ProductVariant } from "@/features/products/types";

export type SizeMode = "standard" | "custom";
export type PreferredTime = "morning" | "afternoon";

export type SelectedQuoteOption = {
  product_option_group_id: number;
  product_option_id: number;
  group_name: string;
  option_name: string;
  price_modifier: number;
};

export type QuoteCartItem = {
  id: string;
  product: Product;
  selected_options: SelectedQuoteOption[];
  size_mode: SizeMode;
  variant: ProductVariant | null;
  width: string;
  height: string;
  thickness: string;
  pieces: number;
  source?: "ar";
  measurement_segments?: number[];
  measurement_height?: number;
};

export type QuoteDraft = Omit<QuoteCartItem, "id">;

export type QuoteItemPayload = {
  product_id: number;
  name: string;
  description: string;
  width: number | null;
  height: number | null;
  thickness: number | null;
  pieces: number;
  amount_per_piece: number;
  options_amount: number;
  total_amount: number;
  notes: string;
  selected_options: SelectedQuoteOption[];
};

export type QuoteCheckoutForm = {
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
  additional_notes: string;
  consent: boolean;
};

export type AppointmentQuotePayload = QuoteCheckoutForm & {
  service_type: "quotation";
  items: QuoteItemPayload[];
};

export type AppointmentQuoteResponse = {
  id: number;
  appointment_number: string;
  status: string;
  has_quotation: boolean;
};

export type QuoteFormErrors = Partial<Record<keyof QuoteCheckoutForm | "items" | "form", string>>;

export type ProductOptionChoice = ProductOption & {
  group: ProductOptionGroup;
};
