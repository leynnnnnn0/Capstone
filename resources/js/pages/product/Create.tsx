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
    type NewImageFile,
    type Variant,
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
    ImageUploader,
    SummaryCard,
    VariantAddForm,
    VariantRowHeader,
} from './components/product-form-components';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    categories: CategoryOption[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Products', href: '/products' },
    { title: 'Create Product', href: '#' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Create({ categories }: Props) {
    const {
        data,
        setData,
        post,
        processing,
        errors: serverErrors,
    } = useForm({
        name: '',
        description: '',
        categories: [] as number[],
        unit: '',
        price_per_unit: '',
        images: [] as File[],
        variants: [] as {
            width: string;
            height: string;
            price: string;
            images: File[];
        }[],
    });

    const [productImages, setProductImages] = useState<NewImageFile[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [variantForm, setVariantForm] = useState<VariantFormState>({
        width: '',
        height: '',
        price: '',
    });
    const [variantFormError, setVariantFormError] = useState('');
    const [clientErrors, setClientErrors] = useState<ClientErrors>({});

    const categoryOptions = categories.map((c) => ({
        value: String(c.id),
        label: c.name,
    }));

    // ── Sync variants to form data ─────────────────────────────────
    const syncVariants = (list: Variant[]) => {
        setData(
            'variants',
            list.map((v) => ({
                width: v.width,
                height: v.height,
                price: v.price,
                images: v.images.map((i) => i.file),
            })),
        );
    };

    // ── Product image handlers ─────────────────────────────────────
    const handleProductImages = useCallback((files: FileList | null) => {
        if (!files) return;
        const { valid, error } = validateFiles(Array.from(files));
        if (error) {
            setClientErrors((p) => ({ ...p, images: error }));
            return;
        }

        setProductImages((prev) => {
            const remaining = MAX_PRODUCT_IMAGES - prev.length;
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
    }, []);

    const removeProductImage = (id: string) => {
        setProductImages((prev) => {
            const updated = prev.filter((i) => i.id !== id);
            setData(
                'images',
                updated.map((i) => i.file),
            );
            return updated;
        });
    };

    // ── Variant image handlers ─────────────────────────────────────
    const handleVariantImages = (variantId: string, files: FileList | null) => {
        if (!files) return;
        const { valid, error } = validateFiles(Array.from(files));
        if (error) return;
        setVariants((prev) => {
            const updated = prev.map((v) => {
                if (v.id !== variantId) return v;
                const remaining = MAX_VARIANT_IMAGES - v.images.length;
                const toAdd = valid.slice(0, remaining).map((file) => ({
                    id: generateId(),
                    file,
                    preview: URL.createObjectURL(file),
                }));
                return { ...v, images: [...v.images, ...toAdd] };
            });
            syncVariants(updated);
            return updated;
        });
    };

    const removeVariantImage = (variantId: string, imageId: string) => {
        setVariants((prev) => {
            const updated = prev.map((v) =>
                v.id === variantId
                    ? { ...v, images: v.images.filter((i) => i.id !== imageId) }
                    : v,
            );
            syncVariants(updated);
            return updated;
        });
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
        const newVariant: Variant = {
            id: generateId(),
            ...variantForm,
            images: [],
        };
        setVariants((prev) => {
            const updated = [...prev, newVariant];
            syncVariants(updated);
            return updated;
        });
        setVariantForm({ width: '', height: '', price: '' });
    };

    const removeVariant = (id: string) => {
        setVariants((prev) => {
            const updated = prev.filter((v) => v.id !== id);
            syncVariants(updated);
            return updated;
        });
    };

    // ── Submit ─────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validateProductForm(data);
        setClientErrors(errs);
        if (Object.keys(errs).length > 0) return;
        post('/products', { forceFormData: true });
    };

    const err = { ...clientErrors, ...serverErrors } as Record<
        string,
        string | undefined
    >;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Product" />
            <div>
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Create Product
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new product to your catalog with variants and
                            images.
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
                                        <p className="text-xs text-muted-foreground">
                                            Standard variant prices are set
                                            separately below.
                                        </p>
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
                                        Add standard sizes with fixed prices.
                                        Each variant can have its own images.
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

                                    {variants.length > 0 ? (
                                        <div className="space-y-3">
                                            {variants.map((v, idx) => (
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
                                                            removeVariant(v.id)
                                                        }
                                                    />
                                                    <div className="border-t px-4 py-3">
                                                        <ImageUploader
                                                            images={v.images}
                                                            onAdd={(files) =>
                                                                handleVariantImages(
                                                                    v.id,
                                                                    files,
                                                                )
                                                            }
                                                            onRemove={(imgId) =>
                                                                removeVariantImage(
                                                                    v.id,
                                                                    imgId,
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
                                    ) : (
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-sm text-muted-foreground">
                                            <Ruler className="mb-2 h-8 w-8 opacity-30" />
                                            <p>No variants added yet</p>
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
                                        First image will be used as the cover.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ImageUploader
                                        images={productImages}
                                        onAdd={handleProductImages}
                                        onRemove={removeProductImage}
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
                                totalVariants={variants.length}
                                totalImages={productImages.length}
                            />
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-background py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/products')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
