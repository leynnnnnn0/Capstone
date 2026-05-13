import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/multi-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useCallback, useState } from 'react';
import { ImagePlus, Ruler, Tag, Info } from 'lucide-react';

import {
    MAX_PRODUCT_IMAGES,
    MAX_VARIANT_IMAGES,
    UNITS,
    type CategoryOption,
    type ClientErrors,
    type ExistingImage,
    type ExistingVariant,
    type NewImageFile,
    type NewVariant,
    type VariantFormState,
} from './types/product-form-types';
import {
    generateId,
    validateFiles,
    validateVariantForm,
    validateProductForm,
} from './utils/product-form-utils';
import {
    FieldError,
    ImageGrid,
    SummaryCard,
    VariantAddForm,
    VariantRowHeader,
} from './components/product-form-components';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    product: {
        id: number;
        name: string;
        description: string | null;
        unit: string;
        price_per_unit: string;
        is_active: boolean;
        categories: CategoryOption[];
        product_images: ExistingImage[];
        product_variants: {
            id: number;
            width: string;
            height: string;
            price: string;
            is_active: boolean;
            product_variant_images: ExistingImage[];
        }[];
    };
    categories: CategoryOption[];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Edit({ product, categories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Products', href: '/products' },
        { title: product.name, href: `/products/${product.id}` },
        { title: 'Edit', href: '#' },
    ];

    const categoryOptions = categories.map((c) => ({
        value: String(c.id),
        label: c.name,
    }));

    // ── useForm ────────────────────────────────────────────────────
    const {
        data,
        setData,
        post,
        processing,
        errors: serverErrors,
    } = useForm({
        _method: 'PUT',
        name: product.name,
        description: product.description ?? '',
        categories: product.categories.map((c) => c.id),
        unit: product.unit,
        price_per_unit: product.price_per_unit,
        images: [] as File[],
        deleted_image_ids: [] as number[],
        variants: [] as {
            id?: number;
            width: string;
            height: string;
            price: string;
            images: File[];
        }[],
        deleted_variant_ids: [] as number[],
    });

    // ── Product images state ───────────────────────────────────────
    const [existingProductImages, setExistingProductImages] = useState<
        ExistingImage[]
    >(product.product_images);
    const [newProductImages, setNewProductImages] = useState<NewImageFile[]>(
        [],
    );
    const [deletedProductImageIds, setDeletedProductImageIds] = useState<
        number[]
    >([]);

    // ── Variants state ─────────────────────────────────────────────
    const [existingVariants, setExistingVariants] = useState<ExistingVariant[]>(
        product.product_variants.map((v) => ({
            id: v.id,
            width: v.width,
            height: v.height,
            price: v.price,
            is_active: v.is_active,
            existingImages: v.product_variant_images,
            newImages: [],
            deletedImageIds: [],
        })),
    );
    const [newVariants, setNewVariants] = useState<NewVariant[]>([]);
    const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);

    const [variantForm, setVariantForm] = useState<VariantFormState>({
        width: '',
        height: '',
        price: '',
    });
    const [variantFormError, setVariantFormError] = useState('');
    const [clientErrors, setClientErrors] = useState<ClientErrors>({});

    // ── Product image handlers ─────────────────────────────────────
    const handleProductImages = useCallback(
        (files: FileList | null) => {
            if (!files) return;
            const { valid, error } = validateFiles(Array.from(files));
            if (error) {
                setClientErrors((p) => ({ ...p, images: error }));
                return;
            }

            setNewProductImages((prev) => {
                const remaining =
                    MAX_PRODUCT_IMAGES -
                    existingProductImages.length -
                    prev.length;
                if (remaining <= 0) {
                    setClientErrors((p) => ({
                        ...p,
                        images: `Maximum ${MAX_PRODUCT_IMAGES} images allowed.`,
                    }));
                    return prev;
                }
                const toAdd = valid.slice(0, remaining).map((file) => ({
                    id: generateId(),
                    file,
                    preview: URL.createObjectURL(file),
                }));
                const updated = [...prev, ...toAdd];
                setData(
                    'images',
                    updated.map((i) => i.file),
                );
                setClientErrors((p) => ({ ...p, images: undefined }));
                return updated;
            });
        },
        [existingProductImages.length],
    );

    const removeExistingProductImage = (id: number) => {
        setExistingProductImages((prev) => prev.filter((i) => i.id !== id));
        const updated = [...deletedProductImageIds, id];
        setDeletedProductImageIds(updated);
        setData('deleted_image_ids', updated);
    };

    const removeNewProductImage = (localId: string) => {
        setNewProductImages((prev) => {
            const updated = prev.filter((i) => i.id !== localId);
            setData(
                'images',
                updated.map((i) => i.file),
            );
            return updated;
        });
    };

    // ── Existing variant image handlers ────────────────────────────
    const handleExistingVariantNewImages = (
        variantId: number,
        files: FileList | null,
    ) => {
        if (!files) return;
        const { valid, error } = validateFiles(Array.from(files));
        if (error) return;
        setExistingVariants((prev) =>
            prev.map((v) => {
                if (v.id !== variantId) return v;
                const remaining =
                    MAX_VARIANT_IMAGES -
                    v.existingImages.length -
                    v.newImages.length;
                const toAdd = valid.slice(0, remaining).map((file) => ({
                    id: generateId(),
                    file,
                    preview: URL.createObjectURL(file),
                }));
                return { ...v, newImages: [...v.newImages, ...toAdd] };
            }),
        );
    };

    const removeExistingVariantImage = (variantId: number, imageId: number) => {
        setExistingVariants((prev) =>
            prev.map((v) =>
                v.id === variantId
                    ? {
                          ...v,
                          existingImages: v.existingImages.filter(
                              (i) => i.id !== imageId,
                          ),
                          deletedImageIds: [...v.deletedImageIds, imageId],
                      }
                    : v,
            ),
        );
    };

    const removeExistingVariantNewImage = (
        variantId: number,
        localId: string,
    ) => {
        setExistingVariants((prev) =>
            prev.map((v) =>
                v.id === variantId
                    ? {
                          ...v,
                          newImages: v.newImages.filter(
                              (i) => i.id !== localId,
                          ),
                      }
                    : v,
            ),
        );
    };

    // ── New variant image handlers ─────────────────────────────────
    const handleNewVariantImages = (
        variantLocalId: string,
        files: FileList | null,
    ) => {
        if (!files) return;
        const { valid, error } = validateFiles(Array.from(files));
        if (error) return;
        setNewVariants((prev) =>
            prev.map((v) => {
                if (v.id !== variantLocalId) return v;
                const remaining = MAX_VARIANT_IMAGES - v.newImages.length;
                const toAdd = valid.slice(0, remaining).map((file) => ({
                    id: generateId(),
                    file,
                    preview: URL.createObjectURL(file),
                }));
                return { ...v, newImages: [...v.newImages, ...toAdd] };
            }),
        );
    };

    const removeNewVariantImage = (variantLocalId: string, localId: string) => {
        setNewVariants((prev) =>
            prev.map((v) =>
                v.id === variantLocalId
                    ? {
                          ...v,
                          newImages: v.newImages.filter(
                              (i) => i.id !== localId,
                          ),
                      }
                    : v,
            ),
        );
    };

    // ── Add / remove variants ──────────────────────────────────────
    const addVariant = () => {
        const { width, height, price } = variantForm;
        const error = validateVariantForm(width, height, price);
        if (error) {
            setVariantFormError(error);
            return;
        }
        setVariantFormError('');
        setNewVariants((prev) => [
            ...prev,
            { id: generateId(), ...variantForm, newImages: [] },
        ]);
        setVariantForm({ width: '', height: '', price: '' });
    };

    const removeExistingVariant = (variantId: number) => {
        setExistingVariants((prev) => prev.filter((v) => v.id !== variantId));
        const updated = [...deletedVariantIds, variantId];
        setDeletedVariantIds(updated);
        setData('deleted_variant_ids', updated);
    };

    const removeNewVariant = (localId: string) => {
        setNewVariants((prev) => prev.filter((v) => v.id !== localId));
    };

    // ── Submit ─────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validateProductForm(data);
        setClientErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const variantsPayload = [
            ...existingVariants.map((v) => ({
                id: v.id,
                width: v.width,
                height: v.height,
                price: v.price,
                images: v.newImages.map((i) => i.file),
            })),
            ...newVariants.map((v) => ({
                width: v.width,
                height: v.height,
                price: v.price,
                images: v.newImages.map((i) => i.file),
            })),
        ];

        setData((prev) => ({ ...prev, variants: variantsPayload }));
        post(`/admin/products/${product.id}`, { forceFormData: true });
    };

    const err = { ...clientErrors, ...serverErrors } as Record<
        string,
        string | undefined
    >;
    const totalImages = existingProductImages.length + newProductImages.length;
    const totalVariants = existingVariants.length + newVariants.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit · ${product.name}`} />

            <div>
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Edit Product
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Update details, images, and variants for{' '}
                            <span className="font-medium text-foreground">
                                {product.name}
                            </span>
                            .
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* ── LEFT ───────────────────────────────────────── */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Basic Info */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">
                                            Basic Information
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Product name, description, and category.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name">
                                            Product Name{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Sliding Glass Door"
                                            value={data.name}
                                            onChange={(e) => {
                                                setData('name', e.target.value);
                                                setClientErrors((p) => ({
                                                    ...p,
                                                    name: undefined,
                                                }));
                                            }}
                                            className={
                                                err.name
                                                    ? 'border-destructive'
                                                    : ''
                                            }
                                        />
                                        <FieldError message={err.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe the product, materials, use cases..."
                                            rows={4}
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <FieldError message={err.description} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>
                                                Category{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <MultiSelect
                                                defaultValue={data.categories.map(
                                                    String,
                                                )}
                                                options={categoryOptions}
                                                onValueChange={(values) => {
                                                    setData(
                                                        'categories',
                                                        values.map(Number),
                                                    );
                                                    setClientErrors((p) => {
                                                        const n = { ...p };
                                                        delete n.categories;
                                                        return n;
                                                    });
                                                }}
                                            />
                                            <FieldError
                                                message={err.categories}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>
                                                Unit{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Select
                                                value={data.unit}
                                                onValueChange={(v) => {
                                                    setData('unit', v);
                                                    setClientErrors((p) => ({
                                                        ...p,
                                                        unit: undefined,
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger
                                                    className={
                                                        err.unit
                                                            ? 'w-full border-destructive'
                                                            : 'w-full'
                                                    }
                                                >
                                                    <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNITS.map((u) => (
                                                        <SelectItem
                                                            key={u.value}
                                                            value={u.value}
                                                        >
                                                            {u.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FieldError message={err.unit} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pricing */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">
                                            Pricing
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Base price per unit for custom size
                                        computation in quotations.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="price_per_unit">
                                            Price per Unit (₱){' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                                ₱
                                            </span>
                                            <Input
                                                id="price_per_unit"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className={`pl-7 ${err.price_per_unit ? 'border-destructive' : ''}`}
                                                value={data.price_per_unit}
                                                onChange={(e) => {
                                                    setData(
                                                        'price_per_unit',
                                                        e.target.value,
                                                    );
                                                    setClientErrors((p) => ({
                                                        ...p,
                                                        price_per_unit:
                                                            undefined,
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <FieldError
                                            message={err.price_per_unit}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Variants */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <Ruler className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">
                                            Product Variants
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Manage standard sizes. Removing a saved
                                        variant is permanent on save.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <VariantAddForm
                                        variantForm={variantForm}
                                        variantFormError={variantFormError}
                                        onChange={(field, value) =>
                                            setVariantForm((p) => ({
                                                ...p,
                                                [field]: value,
                                            }))
                                        }
                                        onAdd={addVariant}
                                    />

                                    {/* Existing variants */}
                                    {existingVariants.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Saved Variants
                                            </p>
                                            {existingVariants.map((v, idx) => (
                                                <div
                                                    key={v.id}
                                                    className="rounded-lg border"
                                                >
                                                    <VariantRowHeader
                                                        width={v.width}
                                                        height={v.height}
                                                        price={v.price}
                                                        index={idx}
                                                        onRemove={() =>
                                                            removeExistingVariant(
                                                                v.id,
                                                            )
                                                        }
                                                    />
                                                    <div className="border-t px-4 py-3">
                                                        <ImageGrid
                                                            existingImages={
                                                                v.existingImages
                                                            }
                                                            newImages={
                                                                v.newImages
                                                            }
                                                            onRemoveExisting={(
                                                                imgId,
                                                            ) =>
                                                                removeExistingVariantImage(
                                                                    v.id,
                                                                    imgId,
                                                                )
                                                            }
                                                            onRemoveNew={(
                                                                localId,
                                                            ) =>
                                                                removeExistingVariantNewImage(
                                                                    v.id,
                                                                    localId,
                                                                )
                                                            }
                                                            onAdd={(files) =>
                                                                handleExistingVariantNewImages(
                                                                    v.id,
                                                                    files,
                                                                )
                                                            }
                                                            max={
                                                                MAX_VARIANT_IMAGES
                                                            }
                                                            label={`Variant Images (optional · max ${MAX_VARIANT_IMAGES})`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* New variants */}
                                    {newVariants.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                New Variants
                                            </p>
                                            {newVariants.map((v, idx) => (
                                                <div
                                                    key={v.id}
                                                    className="rounded-lg border ring-1 ring-primary/30"
                                                >
                                                    <VariantRowHeader
                                                        width={v.width}
                                                        height={v.height}
                                                        price={v.price}
                                                        index={idx}
                                                        isNew
                                                        onRemove={() =>
                                                            removeNewVariant(
                                                                v.id,
                                                            )
                                                        }
                                                    />
                                                    <div className="border-t px-4 py-3">
                                                        <ImageGrid
                                                            existingImages={[]}
                                                            newImages={
                                                                v.newImages
                                                            }
                                                            onRemoveExisting={() => {}}
                                                            onRemoveNew={(
                                                                localId,
                                                            ) =>
                                                                removeNewVariantImage(
                                                                    v.id,
                                                                    localId,
                                                                )
                                                            }
                                                            onAdd={(files) =>
                                                                handleNewVariantImages(
                                                                    v.id,
                                                                    files,
                                                                )
                                                            }
                                                            max={
                                                                MAX_VARIANT_IMAGES
                                                            }
                                                            label={`Variant Images (optional · max ${MAX_VARIANT_IMAGES})`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {totalVariants === 0 && (
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-sm text-muted-foreground">
                                            <Ruler className="mb-2 h-8 w-8 opacity-30" />
                                            <p>No variants</p>
                                            <p className="text-xs opacity-70">
                                                Add standard sizes above
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── RIGHT ──────────────────────────────────────── */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <ImagePlus className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">
                                            Product Images
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-xs">
                                        First image is the cover. New uploads
                                        are marked NEW.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ImageGrid
                                        existingImages={existingProductImages}
                                        newImages={newProductImages}
                                        onRemoveExisting={
                                            removeExistingProductImage
                                        }
                                        onRemoveNew={removeNewProductImage}
                                        onAdd={handleProductImages}
                                        max={MAX_PRODUCT_IMAGES}
                                        error={err.images}
                                    />
                                </CardContent>
                            </Card>

                            <SummaryCard
                                name={data.name}
                                unit={data.unit}
                                pricePerUnit={data.price_per_unit}
                                categories={data.categories}
                                allCategories={categories}
                                totalVariants={totalVariants}
                                totalImages={totalImages}
                                newVariantsCount={newVariants.length}
                                newImagesCount={newProductImages.length}
                                removingVariantsCount={deletedVariantIds.length}
                            />
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-background py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.visit(`/products/${product.id}`)
                            }
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
