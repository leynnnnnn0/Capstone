"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  FieldError,
  ImageUploader,
  OptionGroupEditor,
  ProductBasicsCard,
  Product3DModelUploader,
  ProductSummaryCard,
  VariantEditor,
  type ProductBasicsValue,
} from "@/components/products/ProductFormParts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { updateProduct } from "@/features/products/product-api";
import { validateProductForm } from "@/features/products/product-schema";
import type { Category, Product, ProductFormErrors, ProductFormState } from "@/features/products/types";
import {
  appendProductFormData,
  createProductEditForm,
  MAX_PRODUCT_IMAGES,
  productImages,
} from "@/features/products/product-utils";

type ProductEditFormProps = {
  product: Product;
  categories: Category[];
};

export default function ProductEditForm({ product, categories }: ProductEditFormProps) {
  const router = useRouter();
  const [data, setData] = useState<ProductFormState>(() => createProductEditForm(product));
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const visibleProductImages = productImages(product).filter(
    (image) => !data.deleted_image_ids.includes(image.id),
  );
  const hasVisible3DModel = Boolean(
    data.model_3d || (data.existing_3d_model && !data.delete_3d_model),
  );

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

  const setBasicField = <K extends keyof ProductBasicsValue>(
    field: K,
    value: ProductBasicsValue[K],
  ) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
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

    setSubmitting(true);
    try {
      const updatedProduct = await updateProduct(product.id, appendProductFormData(data));
      router.push(`/dashboard/products/${updatedProduct.id}`);
    } catch (error) {
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
        setErrors({ form: "Failed to update product. Please try again." });
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

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Control whether this product is visible for quoting.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                <Checkbox
                  checked={data.is_active}
                  onCheckedChange={(checked) => setField("is_active", checked === true)}
                />
                <span>
                  <Label className="font-medium">Active product</Label>
                  <span className="block text-xs text-muted-foreground">
                    Inactive products remain saved but hidden from active workflows.
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>

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
              <CardDescription>Remove existing images or add new uploads.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                existingImages={visibleProductImages}
                images={data.images}
                max={MAX_PRODUCT_IMAGES}
                error={errors.images}
                onChange={(images) => setField("images", images)}
                onRemoveExisting={(imageId) =>
                  setField("deleted_image_ids", [...data.deleted_image_ids, imageId])
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3D Model</CardTitle>
              <CardDescription>Replace or remove the model used by AR preview.</CardDescription>
            </CardHeader>
            <CardContent>
              <Product3DModelUploader
                existingModel={data.existing_3d_model}
                modelFile={data.model_3d}
                deleteExisting={data.delete_3d_model}
                error={errors.model_3d}
                onChange={(file) => {
                  setData((current) => ({
                    ...current,
                    model_3d: file,
                    delete_3d_model: file ? false : current.delete_3d_model,
                  }));
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.model_3d;
                    delete next.form;
                    return next;
                  });
                }}
                onRemoveExisting={() =>
                  setData((current) => ({
                    ...current,
                    model_3d: null,
                    delete_3d_model: true,
                  }))
                }
              />
            </CardContent>
          </Card>

          <ProductSummaryCard
            name={data.name}
            unit={data.unit}
            price={data.price_per_unit}
            categories={data.category_ids}
            variants={data.variants.length}
            optionGroups={data.option_groups.length}
            images={visibleProductImages.length + data.images.length}
            model3D={hasVisible3DModel}
          />
        </div>
      </div>

      {errors.form && <FieldError message={errors.form} />}

      <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/products/${product.id}`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
