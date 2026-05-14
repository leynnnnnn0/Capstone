"use client";

import { useEffect, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useRouter } from "next/navigation";

import BookingScheduleFields from "@/components/booking/BookingScheduleFields";
import FormSelect from "@/components/form/FormSelect";
import LocationPicker from "@/components/landing/LocationPicker";
import ProductConfigurator from "@/components/quote/ProductConfigurator";
import QuoteCart from "@/components/quote/QuoteCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAdminAppointment } from "@/features/admin-appointments/admin-appointment-api";
import {
  adminServiceOptions,
  createAdminAppointmentForm,
} from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointmentForm as AdminAppointmentFormState } from "@/features/admin-appointments/types";
import { fetchProducts } from "@/features/products/product-api";
import type { Product } from "@/features/products/types";
import type { QuoteCartItem } from "@/features/quotes/types";
import { cartItemToPayload } from "@/features/quotes/quote-utils";
import { ApiError } from "@/lib/api";

type FieldErrors = Partial<Record<keyof AdminAppointmentFormState | "items" | "form", string>>;

export default function AdminAppointmentForm() {
  const router = useRouter();
  const [data, setData] = useState<AdminAppointmentFormState>(() => createAdminAppointmentForm());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [quoteCart, setQuoteCart] = useState<QuoteCartItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const editingItem = editingIndex !== null ? quoteCart[editingIndex] ?? null : null;
  const showQuoteItems = data.service_type === "quotation" || quoteCart.length > 0;

  useEffect(() => {
    fetchProducts({ is_active: "1", per_page: "100" })
      .then((response) => setProducts(response.data))
      .finally(() => setProductsLoading(false));
  }, []);

  function setField<K extends keyof AdminAppointmentFormState>(field: K, value: AdminAppointmentFormState[K]) {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const response = await createAdminAppointment({
        ...data,
        ...(quoteCart.length > 0 ? { items: quoteCart.map(cartItemToPayload) } : {}),
      });
      router.push(`/dashboard/appointments/${response.data.id}`);
    } catch (error) {
      setErrors(toFieldErrors(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First Name" value={data.first_name} error={errors.first_name} onChange={(value) => setField("first_name", value)} />
          <TextField label="Last Name" value={data.last_name} error={errors.last_name} onChange={(value) => setField("last_name", value)} />
          <TextField label="Phone Number" value={data.phone_number} error={errors.phone_number} onChange={(value) => setField("phone_number", value)} />
          <TextField label="Email" type="email" value={data.email} error={errors.email} onChange={(value) => setField("email", value)} />
        </div>

        <div className="mt-4">
          <Label className="mb-1.5 block">Service Address</Label>
          <LocationPicker
            error={errors.address}
            onLocationChange={({ address, pinned, lat, lng }) => {
              setData((current) => ({
                ...current,
                address,
                address_pinned: pinned,
                address_lat: lat ? lat.toFixed(6) : "",
                address_lng: lng ? lng.toFixed(6) : "",
              }));
              setErrors((current) => ({ ...current, address: undefined, form: undefined }));
            }}
          />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="service_type"
            label="Service Type"
            value={data.service_type}
            options={adminServiceOptions.filter((option) => option.value !== "all")}
            error={errors.service_type}
            onValueChange={(value) => setField("service_type", value)}
          />
          {data.service_type === "other" && (
            <TextField label="Describe Service" value={data.service_type_other} error={errors.service_type_other} onChange={(value) => setField("service_type_other", value)} />
          )}
        </div>

        <div className="mt-4">
          <BookingScheduleFields
            preferredDate={data.preferred_date}
            preferredTime={data.preferred_time}
            dateError={errors.preferred_date}
            timeError={errors.preferred_time}
            onPreferredDateChange={(preferredDate, preferredTime) => {
              setData((current) => ({ ...current, preferred_date: preferredDate, preferred_time: preferredTime }));
              setErrors((current) => ({ ...current, preferred_date: undefined, preferred_time: undefined, form: undefined }));
            }}
            onPreferredTimeChange={(value) => setField("preferred_time", value)}
          />
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="additional_notes">Additional Notes</Label>
          <Textarea
            id="additional_notes"
            rows={4}
            value={data.additional_notes}
            onChange={(event) => setField("additional_notes", event.target.value)}
            className="resize-none"
            placeholder="Access instructions, preferred details, measurements, or special requests."
          />
          {errors.additional_notes && <p className="text-xs text-red-500">{errors.additional_notes}</p>}
        </div>

        {showQuoteItems && (
          <div className="mt-6 border-t pt-6">
            <div className="mb-4">
              <p className="text-sm font-black">Quote Items</p>
              <p className="mt-1 text-sm text-muted-foreground">Attach optional quotation items to this appointment.</p>
            </div>
            {productsLoading ? (
              <div className="rounded-lg border bg-muted/40 p-5 text-sm text-muted-foreground">Loading quote products...</div>
            ) : (
              <QuoteEditor products={products} cart={quoteCart} editingItem={editingItem} editingIndex={editingIndex} setCart={setQuoteCart} setEditingIndex={setEditingIndex} />
            )}
            {errors.items && <p className="mt-3 text-xs text-red-500">{errors.items}</p>}
          </div>
        )}
      </div>

      <aside className="h-fit rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-sm font-black">Create Appointment</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Create a customer appointment request. You can confirm the actual slot and assign workers from the appointment view page.
        </p>
        {data.service_type !== "quotation" && quoteCart.length === 0 && (
          <Button type="button" variant="outline" className="mt-5 h-10 w-full" onClick={() => setField("service_type", "quotation")}>
            Add Quote Items
          </Button>
        )}
        {errors.form && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errors.form}</p>}
        <Button type="submit" className="mt-5 h-11 w-full" disabled={saving}>
          {saving ? "Creating..." : "Create Appointment"}
        </Button>
      </aside>
    </form>
  );
}

function QuoteEditor({
  products,
  cart,
  editingItem,
  editingIndex,
  setCart,
  setEditingIndex,
}: {
  products: Product[];
  cart: QuoteCartItem[];
  editingItem: QuoteCartItem | null;
  editingIndex: number | null;
  setCart: Dispatch<SetStateAction<QuoteCartItem[]>>;
  setEditingIndex: (index: number | null) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-5 xl:flex-row">
      <ProductConfigurator
        products={products}
        preSelectedProductId={null}
        preSelectedVariantId={null}
        editingItem={editingItem}
        onAdd={(item) => setCart((current) => [...current, item])}
        onUpdate={(item) => {
          setCart((current) => current.map((cartItem, index) => (index === editingIndex ? item : cartItem)));
          setEditingIndex(null);
        }}
        onCancelEdit={() => setEditingIndex(null)}
      />
      <QuoteCart
        cart={cart}
        onEdit={setEditingIndex}
        onRemove={(indexToRemove) => {
          setCart((current) => current.filter((_, index) => index !== indexToRemove));
          if (editingIndex === indexToRemove) setEditingIndex(null);
        }}
      />
    </div>
  );
}

function TextField({ label, type = "text", value, error, onChange }: { label: string; type?: string; value: string; error?: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replaceAll(" ", "_");

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function toFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return { form: "Unable to create appointment. Please try again." };
  if (!error.errors) return { form: error.message };

  return Object.entries(error.errors).reduce<FieldErrors>((acc, [field, value]) => {
    acc[field as keyof FieldErrors] = Array.isArray(value) ? value[0] : value;
    return acc;
  }, {});
}
