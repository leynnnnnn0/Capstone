"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import BookingScheduleFields from "@/components/booking/BookingScheduleFields";
import FormSelect from "@/components/form/FormSelect";
import LocationPicker from "@/components/landing/LocationPicker";
import ProductConfigurator from "@/components/quote/ProductConfigurator";
import QuoteCart from "@/components/quote/QuoteCart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import {
  createCustomerAppointment,
  updateCustomerAppointment,
} from "@/features/customer/customer-api";
import {
  customerQuotationToCart,
} from "@/features/customer/customer-quote-utils";
import {
  appointmentToCreatePrefillForm,
  appointmentToForm,
  createCustomerAppointmentForm,
  serviceOptions,
} from "@/features/customer/customer-utils";
import { fetchProducts } from "@/features/products/product-api";
import type { Product } from "@/features/products/types";
import type { QuoteCartItem } from "@/features/quotes/types";
import { cartItemToPayload, quoteTotal } from "@/features/quotes/quote-utils";
import { formatCurrency, productCover } from "@/features/products/product-utils";
import type {
  CustomerAppointment,
  CustomerAppointmentForm,
} from "@/features/customer/types";

type FieldErrors = Partial<Record<keyof CustomerAppointmentForm | "items" | "form", string>>;

function fieldError(error: unknown, fallback: string): FieldErrors {
  if (!(error instanceof ApiError)) return { form: fallback };

  if (!error.errors) return { form: error.message };

  return Object.entries(error.errors).reduce<FieldErrors>((acc, [field, value]) => {
    acc[field as keyof FieldErrors] = Array.isArray(value) ? value[0] : value;
    return acc;
  }, {});
}

export default function AppointmentForm({
  appointment,
  prefillAppointment,
  includePrefillQuotation = false,
}: {
  appointment?: CustomerAppointment;
  prefillAppointment?: CustomerAppointment;
  includePrefillQuotation?: boolean;
}) {
  const router = useRouter();
  const sourceAppointment = appointment ?? prefillAppointment;
  const [data, setData] = useState<CustomerAppointmentForm>(() =>
    appointment
      ? appointmentToForm(appointment)
      : prefillAppointment
        ? appointmentToCreatePrefillForm(prefillAppointment)
      : createCustomerAppointmentForm(),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [quoteCart, setQuoteCart] = useState<QuoteCartItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const editingItem = editingIndex !== null ? quoteCart[editingIndex] ?? null : null;
  const sourceQuotation =
    appointment || includePrefillQuotation ? sourceAppointment?.quotation : undefined;
  const showQuoteItems =
    data.service_type === "quotation" || Boolean(sourceQuotation) || quoteCart.length > 0;

  useEffect(() => {
    let mounted = true;

    fetchProducts({ is_active: "1", per_page: "100" })
      .then((response) => {
        if (!mounted) return;

        setProducts(response.data);
        setQuoteCart(customerQuotationToCart(sourceQuotation, response.data));
      })
      .finally(() => {
        if (mounted) setProductsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [sourceQuotation]);

  const setField = <K extends keyof CustomerAppointmentForm>(
    field: K,
    value: CustomerAppointmentForm[K],
  ) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (showQuoteItems && sourceQuotation && quoteCart.length === 0) {
      setErrors({ items: "Keep at least one quote item, or contact SOG to remove the quote." });
      return;
    }

    setConfirmOpen(true);
  }

  async function performSubmit() {
    setSaving(true);
    setErrors({});

    try {
      const payload = {
        ...data,
        ...(quoteCart.length > 0 ? { items: quoteCart.map(cartItemToPayload) } : {}),
      };
      const response = appointment
        ? await updateCustomerAppointment(appointment.id, payload)
        : await createCustomerAppointment(payload);

      router.push(`/account/appointments/${response.data.id}`);
    } catch (error) {
      setErrors(fieldError(error, "Unable to save appointment. Please try again."));
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First Name" value={data.first_name} error={errors.first_name} onChange={(value) => setField("first_name", value)} />
          <TextField label="Last Name" value={data.last_name} error={errors.last_name} onChange={(value) => setField("last_name", value)} />
          <TextField label="Phone Number" value={data.phone_number} error={errors.phone_number} onChange={(value) => setField("phone_number", value)} />
          <TextField label="Email" value={data.email} error={errors.email} onChange={(value) => setField("email", value)} />
        </div>

        <div className="mt-4">
          <Label className="mb-1.5 block">Service Address</Label>
          <LocationPicker
            error={errors.address}
            initialValue={{
              address: data.address,
              pinned: data.address_pinned,
              lat: data.address_lat ? Number(data.address_lat) : null,
              lng: data.address_lng ? Number(data.address_lng) : null,
            }}
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
            options={[...serviceOptions]}
            error={errors.service_type}
            onValueChange={(value) => setField("service_type", value)}
          />
          {data.service_type === "other" && (
            <TextField
              label="Describe Service"
              value={data.service_type_other}
              error={errors.service_type_other}
              onChange={(value) => setField("service_type_other", value)}
            />
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
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-950">Quote Items</p>
              <p className="mt-1 text-sm text-slate-500">
                Add product selections to help us prepare a clearer estimate before inspection.
              </p>
            </div>
            {productsLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
                Loading quote products...
              </div>
            ) : (
              <div className="space-y-5">
                <SuggestedProducts
                  products={products}
                  selectedProductId={selectedProductId}
                  onSelect={(productId) => {
                    setSelectedProductId(productId);
                    setEditingIndex(null);
                  }}
                />
                <div className="flex flex-col items-start gap-5 xl:flex-row">
                  <ProductConfigurator
                    products={products}
                    preSelectedProductId={selectedProductId}
                    preSelectedVariantId={null}
                    editingItem={editingItem}
                    onAdd={(item) => {
                      setQuoteCart((current) => [...current, item]);
                      setSelectedProductId(null);
                    }}
                    onUpdate={(item) => {
                      setQuoteCart((current) =>
                        current.map((cartItem, index) => (index === editingIndex ? item : cartItem)),
                      );
                      setEditingIndex(null);
                      setSelectedProductId(null);
                    }}
                    onCancelEdit={() => setEditingIndex(null)}
                  />
                  <QuoteCart
                    cart={quoteCart}
                    onEdit={setEditingIndex}
                    onRemove={(indexToRemove) => {
                      setQuoteCart((current) => current.filter((_, index) => index !== indexToRemove));
                      if (editingIndex === indexToRemove) setEditingIndex(null);
                    }}
                  />
                </div>
              </div>
            )}
            {errors.items && <p className="mt-3 text-xs text-red-500">{errors.items}</p>}
          </div>
        )}
      </div>

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-950">
          {appointment ? "Update Appointment" : includePrefillQuotation ? "Rebook Appointment" : "Create Appointment"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          You can edit this appointment while it is still pending. Once confirmed,
          our team will manage schedule changes with you directly.
        </p>
        {errors.form && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errors.form}</p>}
        {quoteCart.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Quote items</span>
              <span className="font-medium text-slate-900">{quoteCart.length}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-slate-500">Estimated total</span>
              <span className="font-medium text-primary">{formatCurrency(quoteTotal(quoteCart))}</span>
            </div>
          </div>
        )}
        <Button type="submit" className="mt-5 h-11 w-full" disabled={saving}>
          {saving
            ? "Saving..."
            : appointment
              ? "Save Changes"
              : prefillAppointment
                ? includePrefillQuotation
                  ? "Create Rebooked Appointment"
                  : "Create Appointment"
                : "Create Appointment"}
        </Button>
      </aside>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{appointment ? "Save appointment changes?" : "Create appointment?"}</DialogTitle>
            <DialogDescription>
              {appointment
                ? "This will update your pending appointment request."
                : "This will send your appointment request to the SOG team for review."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={performSubmit}>
              {saving ? "Saving..." : appointment ? "Save Changes" : "Create Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

function SuggestedProducts({
  products,
  selectedProductId,
  onSelect,
}: {
  products: Product[];
  selectedProductId: number | null;
  onSelect: (productId: number) => void;
}) {
  const suggested = products.slice(0, 4);

  if (suggested.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Suggested items</p>
          <p className="text-xs text-slate-500">Pick a product to start building your quote.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {suggested.map((product) => {
          const image = productCover(product);
          const selected = selectedProductId === product.id;

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={`overflow-hidden rounded-lg border bg-white text-left transition hover:border-primary/50 hover:shadow-sm ${
                selected ? "border-primary ring-2 ring-primary/15" : "border-slate-200"
              }`}
            >
              <div className="relative h-28 bg-slate-100">
                {image ? (
                  <Image src={image} alt={product.name} fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-medium text-slate-950">{product.name}</p>
                <p className="mt-1 line-clamp-2 min-h-8 text-xs text-slate-500">
                  {product.description || "Custom glass and aluminum item"}
                </p>
                <p className="mt-2 text-sm font-medium text-primary">
                  {formatCurrency(product.price_per_unit)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(" ", "_");

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
