"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FieldError,
  ImageUploader,
  OptionGroupEditor,
  ProductBasicsCard,
  Product3DModelUploader,
  ProductSummaryCard,
  ProductWarrantyCard,
  VariantEditor,
} from "@/components/products/ProductFormParts";
import { createProduct } from "@/features/products/product-api";
import { validateProductForm } from "@/features/products/product-schema";
import type { Category, ProductFormErrors, ProductFormState } from "@/features/products/types";
import {
  appendProductFormData,
  createInitialProductForm,
  MAX_PRODUCT_IMAGES,
} from "@/features/products/product-utils";

export default function ProductCreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [data, setData] = useState<ProductFormState>(() => createInitialProductForm());
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setField = <K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const setBasicField = (
    field: "name" | "description" | "category_ids" | "unit" | "price_per_unit",
    value: ProductFormState[typeof field],
  ) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const setWarrantyField = <K extends keyof ProductFormState["warranty"]>(
    field: K,
    value: ProductFormState["warranty"][K],
  ) => {
    setData((current) => ({
      ...current,
      warranty: { ...current.warranty, [field]: value },
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`warranty.${field}` as keyof ProductFormErrors];
      delete next.form;
      return next;
    });
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProductForm(data);
    if (Object.keys(nextErrors).length > 0) {
      setErrors({ ...nextErrors, form: "Please fix the highlighted fields." });
      return;
    }

    setConfirmOpen(true);
  }

  async function createConfirmed() {
    setSubmitting(true);
    try {
      const product = await createProduct(appendProductFormData(data));
      toast.success("Product created successfully.");
      router.push(`/dashboard/products/${product.id}`);
    } catch (error) {
      setConfirmOpen(false);
      toast.error(error instanceof Error ? error.message : "Failed to create product.");
      if (error instanceof ApiError && error.errors) {
        setErrors(
          Object.entries(error.errors).reduce<ProductFormErrors>(
            (acc, [field, value]) => {
              acc[field as keyof ProductFormErrors] = Array.isArray(value)
                ? value[0]
                : value;
              return acc;
            },
            {},
          ),
        );
      } else {
        setErrors({ form: "Failed to create product. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <ProductBasicsCard
            value={{
              name: data.name,
              description: data.description,
              category_ids: data.category_ids,
              unit: data.unit,
              price_per_unit: data.price_per_unit,
            }}
            categories={categories}
            errors={errors}
            onChange={setBasicField}
          />

          <VariantEditor
            variants={data.variants}
            errors={errors}
            onChange={(variants) => setField("variants", variants)}
          />

          <OptionGroupEditor
            groups={data.option_groups}
            errors={errors}
            onChange={(groups) => setField("option_groups", groups)}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>First image becomes the product cover.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                images={data.images}
                max={MAX_PRODUCT_IMAGES}
                error={errors.images}
                onChange={(images) => setField("images", images)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3D Model</CardTitle>
              <CardDescription>Used by the AR product preview and measuring tool.</CardDescription>
            </CardHeader>
            <CardContent>
              <Product3DModelUploader
                modelFile={data.model_3d}
                error={errors.model_3d}
                onChange={(file) => setField("model_3d", file)}
              />
            </CardContent>
          </Card>

          <ProductWarrantyCard
            value={data.warranty}
            errors={errors}
            onChange={setWarrantyField}
          />

          <ProductSummaryCard
            name={data.name}
            unit={data.unit}
            price={data.price_per_unit}
            categories={data.category_ids}
            variants={data.variants.length}
            optionGroups={data.option_groups.length}
            images={data.images.length}
            model3D={Boolean(data.model_3d)}
            warrantyMonths={data.warranty.duration_months}
            warrantyActive={data.warranty.is_active}
          />
        </div>
      </div>

      {errors.form && <FieldError message={errors.form} />}

      <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background py-4">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Create Product"}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add the product, warranty policy, variants, option groups, images, and 3D model to the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Review</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(event) => {
                event.preventDefault();
                void createConfirmed();
              }}
            >
              {submitting ? "Creating..." : "Create Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
