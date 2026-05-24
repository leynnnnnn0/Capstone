"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { AlertCircle, Box, ExternalLink, ImagePlus, Plus, Trash2, X } from "lucide-react";

import FormSelect from "@/components/form/FormSelect";
import NumericInput from "@/components/form/NumericInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import Product3DModelViewer from "@/components/products/Product3DModelViewer";
import type {
  Category,
  NewImageFile,
  Product3DModel,
  ProductFormErrors,
  ProductImage,
  ProductOptionGroupDraft,
  ProductUnit,
  ProductVariantDraft,
} from "@/features/products/types";
import {
  calcArea,
  createImageDrafts,
  formatFileSize,
  formatCurrency,
  generateId,
  imageUrl,
  MAX_VARIANT_IMAGES,
  model3DUrl,
  PRODUCT_UNITS,
  validate3DModelFile,
  validateImageFiles,
} from "@/features/products/product-utils";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export function ImageUploader({
  existingImages = [],
  images,
  max,
  onChange,
  onRemoveExisting,
  error,
}: {
  existingImages?: ProductImage[];
  images: NewImageFile[];
  max: number;
  onChange: (images: NewImageFile[]) => void;
  onRemoveExisting?: (imageId: number) => void;
  error?: string;
}) {
  const addImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = max - existingImages.length - images.length;
    if (remaining <= 0) return;

    const { valid } = validateImageFiles(Array.from(files));
    onChange([...images, ...createImageDrafts(valid.slice(0, remaining))]);
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition-colors hover:bg-muted/50">
        <ImagePlus className="mb-2 h-6 w-6 text-muted-foreground" />
        <span className="text-sm font-medium">Drop images here or browse</span>
        <span className="text-xs text-muted-foreground">
          PNG, JPG, WEBP · Max {max} images
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => addImages(event.target.files)}
        />
      </label>
      <FieldError message={error} />
      {existingImages.length + images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {existingImages.map((image, index) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md border">
              <img src={imageUrl(image)} alt="" className="h-full w-full object-cover" />
              {index === 0 && images.length === 0 && (
                <span className="absolute inset-x-0 bottom-0 bg-primary py-0.5 text-center text-[9px] font-semibold text-white">
                  COVER
                </span>
              )}
              {onRemoveExisting && (
                <button
                  type="button"
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onRemoveExisting(image.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {images.map((image, index) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md border ring-1 ring-primary/40">
              <img src={image.preview} alt="" className="h-full w-full object-cover" />
              {existingImages.length === 0 && index === 0 && (
                <span className="absolute inset-x-0 bottom-0 bg-primary py-0.5 text-center text-[9px] font-semibold text-white">
                  COVER
                </span>
              )}
              <span className="absolute left-1 top-1 rounded bg-primary/80 px-1 py-0.5 text-[8px] font-bold text-white">
                NEW
              </span>
              <button
                type="button"
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onChange(images.filter((item) => item.id !== image.id))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {existingImages.length + images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {existingImages.length + images.length} / {max} images
          {images.length > 0 ? ` · ${images.length} new` : ""}
        </p>
      )}
    </div>
  );
}

export function Product3DModelUploader({
  existingModel,
  modelFile,
  deleteExisting,
  onChange,
  onRemoveExisting,
  error,
}: {
  existingModel?: Product3DModel | null;
  modelFile: File | null;
  deleteExisting?: boolean;
  onChange: (file: File | null) => void;
  onRemoveExisting?: () => void;
  error?: string;
}) {
  const [localError, setLocalError] = useState<string>();
  const visibleExisting = existingModel && !deleteExisting && !modelFile;
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const previewUrl = localPreviewUrl ?? (visibleExisting ? model3DUrl(existingModel) : null);

  useEffect(() => {
    if (!modelFile) {
      setLocalPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(modelFile);
    setLocalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [modelFile]);

  const addModel = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    const result = validate3DModelFile(file);

    if (!result.valid) {
      setLocalError(result.error);
      return;
    }

    setLocalError(undefined);
    onChange(file);
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition-colors hover:bg-muted/50">
        <Box className="mb-2 h-6 w-6 text-muted-foreground" />
        <span className="text-sm font-medium">Upload 3D model</span>
        <span className="text-xs text-muted-foreground">
          GLB or GLTF · Max 50MB · One model per product
        </span>
        <input
          type="file"
          accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
          className="hidden"
          onChange={(event) => {
            addModel(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>

      <FieldError message={localError ?? error} />

      <Product3DModelViewer
        src={previewUrl}
        title={
          modelFile
            ? "New 3D model preview"
            : visibleExisting
              ? "Current 3D model preview"
              : "3D model preview"
        }
        compact
      />

      {visibleExisting && (
        <div className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Box className="h-4 w-4 text-primary" />
                <span className="truncate">
                  {existingModel.original_name ?? "Product 3D model"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(existingModel.file_size) || "Ready for AR preview"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {model3DUrl(existingModel) && (
                <Button type="button" variant="ghost" size="icon-sm" asChild>
                  <a href={model3DUrl(existingModel)} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              {onRemoveExisting && (
                <Button type="button" variant="ghost" size="icon-sm" onClick={onRemoveExisting}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {modelFile && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Box className="h-4 w-4 text-primary" />
                <span className="truncate">{modelFile.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                New upload · {formatFileSize(modelFile.size)}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {deleteExisting && !modelFile && (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Existing 3D model will be removed after saving.
        </p>
      )}
    </div>
  );
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  error,
}: {
  categories: Category[];
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
}) {
  const options: MultiSelectOption[] = categories.map((category) => ({
    label: category.name,
    value: String(category.id),
  }));

  return (
    <div className="space-y-2">
      <Label>
        Categories <span className="text-destructive">*</span>
      </Label>
      <MultiSelect
        options={options}
        defaultValue={value.map(String)}
        onValueChange={(nextValue) => onChange(nextValue.map(Number))}
        placeholder="Select categories"
        maxCount={3}
        hideSelectAll
        className="w-full"
      />
      <FieldError message={error} />
    </div>
  );
}

export function ProductBasicsCard({
  value,
  categories,
  errors,
  onChange,
}: {
  value: ProductBasicsValue;
  categories: Category[];
  errors: ProductFormErrors;
  onChange: <K extends keyof ProductBasicsValue>(
    field: K,
    nextValue: ProductBasicsValue[K],
  ) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Product name, categories, unit, and base price.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={value.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Sliding Glass Door"
          />
          <FieldError message={errors.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={value.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Describe materials, use cases, and installation notes."
            rows={4}
          />
          <FieldError message={errors.description} />
        </div>
        <CategoryPicker
          categories={categories}
          value={value.category_ids}
          onChange={(nextValue) => onChange("category_ids", nextValue)}
          error={errors.category_ids}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="unit"
            label="Unit"
            value={value.unit}
            options={PRODUCT_UNITS}
            placeholder="Select unit"
            error={errors.unit}
            onValueChange={(nextValue) => onChange("unit", nextValue)}
          />
          <div className="space-y-1.5">
            <Label htmlFor="price_per_unit">Price per Unit</Label>
            <NumericInput
              id="price_per_unit"
              value={value.price_per_unit}
              decimalScale={2}
              onValueChange={(nextValue) => onChange("price_per_unit", nextValue)}
              placeholder="0.00"
            />
            <FieldError message={errors.price_per_unit} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type ProductBasicsValue = {
  name: string;
  description: string;
  category_ids: number[];
  unit: ProductUnit | "";
  price_per_unit: string;
};

export function VariantEditor({
  variants,
  onChange,
  errors = {},
}: {
  variants: ProductVariantDraft[];
  onChange: (variants: ProductVariantDraft[]) => void;
  errors?: ProductFormErrors;
}) {
  const addVariant = () => {
    onChange([
      ...variants,
      {
        id: generateId(),
        width: "",
        height: "",
        price: "",
        images: [],
        existing_images: [],
        deleted_image_ids: [],
      },
    ]);
  };

  const updateVariant = (
    id: string,
    patch: Partial<ProductVariantDraft>,
  ) => {
    onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Variants</CardTitle>
            <CardDescription>Optional fixed-size products with their own images.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={addVariant}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {variants.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No variants added.
          </p>
        ) : (
          variants.map((variant, index) => (
            <div key={variant.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Variant #{index + 1}</Badge>
                  {variant.width && variant.height && (
                    <Badge variant="secondary">
                      {calcArea(variant.width, variant.height)} sqm
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onChange(variants.filter((item) => item.id !== variant.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <NumericInput
                  placeholder="Width (cm)"
                  value={variant.width}
                  onValueChange={(value) => updateVariant(variant.id, { width: value })}
                />
                <NumericInput
                  placeholder="Height (cm)"
                  value={variant.height}
                  onValueChange={(value) => updateVariant(variant.id, { height: value })}
                />
                <NumericInput
                  placeholder="Fixed Price"
                  value={variant.price}
                  decimalScale={2}
                  onValueChange={(value) => updateVariant(variant.id, { price: value })}
                />
              </div>
              <FieldError message={errors[`variants.${index}.width`]} />
              <FieldError message={errors[`variants.${index}.height`]} />
              <FieldError message={errors[`variants.${index}.price`]} />
              <ImageUploader
                existingImages={variant.existing_images ?? []}
                images={variant.images}
                max={MAX_VARIANT_IMAGES}
                onChange={(images) => updateVariant(variant.id, { images })}
                onRemoveExisting={(imageId) =>
                  updateVariant(variant.id, {
                    existing_images: (variant.existing_images ?? []).filter(
                      (image) => image.id !== imageId,
                    ),
                    deleted_image_ids: [
                      ...(variant.deleted_image_ids ?? []),
                      imageId,
                    ],
                  })
                }
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function OptionGroupEditor({
  groups,
  onChange,
  errors = {},
}: {
  groups: ProductOptionGroupDraft[];
  onChange: (groups: ProductOptionGroupDraft[]) => void;
  errors?: ProductFormErrors;
}) {
  const addGroup = () => {
    onChange([
      ...groups,
      { id: generateId(), name: "", is_required: true, sort_order: groups.length, options: [] },
    ]);
  };

  const updateGroup = (id: string, patch: Partial<ProductOptionGroupDraft>) => {
    onChange(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Option Groups</CardTitle>
            <CardDescription>
              Add choices such as glass type, screen type, or frame finish during creation.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={addGroup}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No option groups added.
          </p>
        ) : (
          groups.map((group, groupIndex) => (
            <div key={group.id} className="space-y-3 rounded-lg border p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  value={group.name}
                  onChange={(event) => updateGroup(group.id, { name: event.target.value })}
                  placeholder="Group name, e.g. Glass Type"
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={group.is_required}
                    onCheckedChange={(checked) => updateGroup(group.id, { is_required: checked === true })}
                  />
                  Required
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onChange(groups.filter((item) => item.id !== group.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <FieldError message={errors[`option_groups.${groupIndex}.name`]} />
              <FieldError message={errors[`option_groups.${groupIndex}.options`]} />
              <div className="space-y-2">
                {group.options.map((option, optionIndex) => (
                  <div key={option.id} className="space-y-1">
                    <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
                      <Input
                        value={option.name}
                        onChange={(event) => {
                          const options = group.options.map((item) =>
                            item.id === option.id ? { ...item, name: event.target.value } : item,
                          );
                          updateGroup(group.id, { options });
                        }}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <NumericInput
                        value={option.price_modifier}
                        decimalScale={2}
                        onValueChange={(value) => {
                          const options = group.options.map((item) =>
                            item.id === option.id
                              ? { ...item, price_modifier: value }
                              : item,
                          );
                          updateGroup(group.id, { options });
                        }}
                        placeholder="Price add-on"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          updateGroup(group.id, {
                            options: group.options.filter((item) => item.id !== option.id),
                          })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FieldError
                      message={errors[`option_groups.${groupIndex}.options.${optionIndex}.name`]}
                    />
                    <FieldError
                      message={
                        errors[
                          `option_groups.${groupIndex}.options.${optionIndex}.price_modifier`
                        ]
                      }
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateGroup(group.id, {
                      options: [
                        ...group.options,
                        {
                          id: generateId(),
                          name: "",
                          price_modifier: "0",
                          sort_order: group.options.length,
                          is_active: true,
                        },
                      ],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Group #{groupIndex + 1} · {group.options.length} option
                {group.options.length === 1 ? "" : "s"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ProductSummaryCard({
  name,
  unit,
  price,
  categories,
  variants,
  optionGroups,
  images,
  model3D,
}: {
  name: string;
  unit: string;
  price: string;
  categories: number[];
  variants: number;
  optionGroups: number;
  images: number;
  model3D?: boolean;
}) {
  if (!name && categories.length === 0 && variants === 0 && optionGroups === 0) return null;

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-sm">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {name && <SummaryRow label="Name" value={name} />}
        {unit && <SummaryRow label="Unit" value={unit} />}
        {price && <SummaryRow label="Price" value={formatCurrency(price)} />}
        <SummaryRow label="Categories" value={String(categories.length)} />
        <SummaryRow label="Images" value={String(images)} />
        <SummaryRow label="3D Model" value={model3D ? "Attached" : "None"} />
        <SummaryRow label="Variants" value={String(variants)} />
        <SummaryRow label="Option Groups" value={String(optionGroups)} />
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}
