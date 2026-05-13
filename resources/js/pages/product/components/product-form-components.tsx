import { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    GripVertical,
    ImagePlus,
    Trash2,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    MAX_FILE_SIZE_MB,
    MAX_VARIANT_IMAGES,
    type CategoryOption,
    type ExistingImage,
    type NewImageFile,
} from '../types/product-form-types';
import { calcArea } from '../utils/product-form-utils';

// ─── FieldError ───────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {message}
        </p>
    );
}

// ─── ImageUploadZone ──────────────────────────────────────────────────────────
// The drag-and-drop dropzone — shared by ImageUploader and ImageGrid.

interface ImageUploadZoneProps {
    max: number;
    error?: string;
    onAdd: (files: FileList | null) => void;
}

export function ImageUploadZone({ max, error, onAdd }: ImageUploadZoneProps) {
    const ref = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);

    return (
        <>
            <div
                onClick={() => ref.current?.click()}
                onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    onAdd(e.dataTransfer.files);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                    error
                        ? 'border-destructive bg-destructive/5'
                        : drag
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50 hover:bg-muted/40'
                }`}
            >
                <ImagePlus className="mb-1.5 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">Drop images here</p>
                <p className="text-xs text-muted-foreground">
                    or click to browse
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                    PNG, JPG, WEBP · Max {MAX_FILE_SIZE_MB}MB · Up to {max}{' '}
                    images
                </p>
            </div>
            <input
                ref={ref}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onAdd(e.target.files)}
            />
            {error && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {error}
                </p>
            )}
        </>
    );
}

// ─── ImageUploader ────────────────────────────────────────────────────────────
// Used in Create — all images are local (NewImageFile shape, no existing).

interface ImageUploaderProps {
    images: NewImageFile[];
    onAdd: (files: FileList | null) => void;
    onRemove: (id: string) => void;
    max: number;
    label?: string;
    error?: string;
}

export function ImageUploader({
    images,
    onAdd,
    onRemove,
    max,
    label,
    error,
}: ImageUploaderProps) {
    return (
        <div className="space-y-2">
            {label && <Label className="text-xs">{label}</Label>}
            <ImageUploadZone max={max} error={error} onAdd={onAdd} />
            {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                        <div
                            key={img.id}
                            className="group relative aspect-square overflow-hidden rounded-md border"
                        >
                            <img
                                src={img.preview}
                                alt={`preview-${idx}`}
                                className="h-full w-full object-cover"
                            />
                            {idx === 0 && (
                                <div className="absolute right-0 bottom-0 left-0 bg-primary py-0.5 text-center text-[9px] font-semibold text-white">
                                    COVER
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(img.id);
                                }}
                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {images.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    {images.length} / {max} image
                    {images.length !== 1 ? 's' : ''} selected
                </p>
            )}
        </div>
    );
}

// ─── ImageGrid ────────────────────────────────────────────────────────────────
// Used in Edit — handles both existing (server) images and new local images.

interface ImageGridProps {
    existingImages: ExistingImage[];
    newImages: NewImageFile[];
    onRemoveExisting: (id: number) => void;
    onRemoveNew: (id: string) => void;
    onAdd: (files: FileList | null) => void;
    max: number;
    label?: string;
    error?: string;
}

export function ImageGrid({
    existingImages,
    newImages,
    onRemoveExisting,
    onRemoveNew,
    onAdd,
    max,
    label,
    error,
}: ImageGridProps) {
    const totalCount = existingImages.length + newImages.length;

    return (
        <div className="space-y-2">
            {label && <Label className="text-xs">{label}</Label>}
            <ImageUploadZone max={max} error={error} onAdd={onAdd} />
            {totalCount > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {existingImages.map((img, idx) => (
                        <div
                            key={img.id}
                            className="group relative aspect-square overflow-hidden rounded-md border"
                        >
                            <img
                                src={img.url}
                                alt="existing"
                                className="h-full w-full object-cover"
                            />
                            {idx === 0 && newImages.length === 0 && (
                                <div className="absolute right-0 bottom-0 left-0 bg-primary py-0.5 text-center text-[9px] font-semibold text-white">
                                    COVER
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveExisting(img.id);
                                }}
                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {newImages.map((img, idx) => (
                        <div
                            key={img.id}
                            className="group relative aspect-square overflow-hidden rounded-md border ring-1 ring-primary/40"
                        >
                            <img
                                src={img.preview}
                                alt="new"
                                className="h-full w-full object-cover"
                            />
                            {existingImages.length === 0 && idx === 0 && (
                                <div className="absolute right-0 bottom-0 left-0 bg-primary py-0.5 text-center text-[9px] font-semibold text-white">
                                    COVER
                                </div>
                            )}
                            <div className="absolute top-1 left-1 rounded bg-primary/80 px-1 py-0.5 text-[8px] font-bold text-white">
                                NEW
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveNew(img.id);
                                }}
                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {totalCount > 0 && (
                <p className="text-xs text-muted-foreground">
                    {totalCount} / {max} image{totalCount !== 1 ? 's' : ''}
                    {newImages.length > 0 && ` · ${newImages.length} new`}
                </p>
            )}
        </div>
    );
}

// ─── VariantRowHeader ─────────────────────────────────────────────────────────
// The top bar of a variant card (dimensions + badges + delete button).

interface VariantRowHeaderProps {
    width: string;
    height: string;
    price: string;
    index: number;
    isNew?: boolean;
    onRemove: () => void;
}

export function VariantRowHeader({
    width,
    height,
    price,
    index,
    isNew = false,
    onRemove,
}: VariantRowHeaderProps) {
    const area = calcArea(width, height);
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">
                    {width} × {height} cm
                </span>
                <Badge variant="outline" className="text-xs">
                    {area} sqm
                </Badge>
                <Badge variant="secondary" className="text-xs">
                    ₱{parseFloat(price).toLocaleString()}
                </Badge>
                {isNew ? (
                    <Badge className="text-xs">NEW</Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                    >
                        Variant #{index + 1}
                    </Badge>
                )}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                onClick={onRemove}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

// ─── VariantFormError ─────────────────────────────────────────────────────────

export function VariantFormError({ message }: { message: string }) {
    if (!message) return null;
    return (
        <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" /> {message}
        </p>
    );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
    name: string;
    unit: string;
    pricePerUnit: string;
    categories: number[];
    allCategories: CategoryOption[];
    totalVariants: number;
    totalImages: number;
    newVariantsCount?: number;
    newImagesCount?: number;
    removingVariantsCount?: number;
}

export function SummaryCard({
    name,
    unit,
    pricePerUnit,
    categories,
    allCategories,
    totalVariants,
    totalImages,
    newVariantsCount = 0,
    newImagesCount = 0,
    removingVariantsCount = 0,
}: SummaryCardProps) {
    const visible = name || categories.length > 0 || totalVariants > 0;
    if (!visible) return null;

    const selectedCategoryLabels = allCategories
        .filter((c) => categories.includes(c.id))
        .map((c) => c.name);

    return (
        <Card className="bg-muted/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                {name && (
                    <div className="flex justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">
                            Name
                        </span>
                        <span className="truncate text-right font-medium">
                            {name}
                        </span>
                    </div>
                )}
                {selectedCategoryLabels.length > 0 && (
                    <div className="flex justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">
                            Categories
                        </span>
                        <div className="flex flex-wrap justify-end gap-1">
                            {selectedCategoryLabels.map((label) => (
                                <Badge
                                    key={label}
                                    variant="outline"
                                    className="text-xs capitalize"
                                >
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
                {unit && (
                    <div className="flex justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">
                            Unit
                        </span>
                        <span className="text-xs font-medium uppercase">
                            {unit}
                        </span>
                    </div>
                )}
                {pricePerUnit && (
                    <div className="flex justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">
                            Price/Unit
                        </span>
                        <span className="font-medium">
                            ₱{parseFloat(pricePerUnit).toLocaleString()}
                        </span>
                    </div>
                )}
                {totalVariants > 0 && (
                    <div className="flex justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">
                            Variants
                        </span>
                        <span className="font-medium">
                            {totalVariants}
                            {newVariantsCount > 0 && (
                                <span className="ml-1 text-xs text-primary">
                                    +{newVariantsCount} new
                                </span>
                            )}
                        </span>
                    </div>
                )}
                {totalImages > 0 && (
                    <div className="flex justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">
                            Images
                        </span>
                        <span className="font-medium">
                            {totalImages}
                            {newImagesCount > 0 && (
                                <span className="ml-1 text-xs text-primary">
                                    +{newImagesCount} new
                                </span>
                            )}
                        </span>
                    </div>
                )}
                {removingVariantsCount > 0 && (
                    <div className="flex justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">
                            Removing
                        </span>
                        <span className="text-xs font-medium text-destructive">
                            {removingVariantsCount} variant
                            {removingVariantsCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── VariantAddForm ───────────────────────────────────────────────────────────
// The "Add Variant" input group — identical in both Create and Edit.

interface VariantAddFormProps {
    variantForm: { width: string; height: string; price: string };
    variantFormError: string;
    onChange: (field: 'width' | 'height' | 'price', value: string) => void;
    onAdd: () => void;
}

export function VariantAddForm({
    variantForm,
    variantFormError,
    onChange,
    onAdd,
}: VariantAddFormProps) {
    const fields = [
        { key: 'width' as const, label: 'Width (cm)', placeholder: 'e.g. 120' },
        {
            key: 'height' as const,
            label: 'Height (cm)',
            placeholder: 'e.g. 240',
        },
        {
            key: 'price' as const,
            label: 'Fixed Price (₱)',
            placeholder: 'e.g. 6500',
        },
    ];

    return (
        <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Add New Variant
            </p>
            <div className="grid grid-cols-3 gap-3">
                {fields.map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <input
                            type="number"
                            placeholder={placeholder}
                            value={variantForm[key]}
                            onChange={(e) => onChange(key, e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        />
                    </div>
                ))}
            </div>
            <VariantFormError message={variantFormError} />
            <Button type="button" size="sm" className="mt-3" onClick={onAdd}>
                <span className="mr-1.5 flex h-3.5 w-3.5 items-center justify-center">
                    +
                </span>
                Add Variant
            </Button>
        </div>
    );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
    images: { id: number; url: string }[];
    initialIndex: number;
    onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
    const [index, setIndex] = useState(initialIndex);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
            if (e.key === 'ArrowRight')
                setIndex((i) => Math.min(images.length - 1, i + 1));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [images.length, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
                <X className="h-4 w-4" />
            </button>

            {index > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIndex((i) => i - 1);
                    }}
                    className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
            )}

            <img
                src={images[index].url}
                alt={`image-${index + 1}`}
                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />

            {index < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIndex((i) => i + 1);
                    }}
                    className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            )}

            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                    {index + 1} / {images.length}
                </div>
            )}
        </div>
    );
}

// ─── FlashMessage ─────────────────────────────────────────────────────────────

export function FlashMessage({ message }: { message?: string }) {
    const [visible, setVisible] = useState(!!message);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const t = setTimeout(() => setVisible(false), 3000);
            return () => clearTimeout(t);
        }
    }, [message]);

    if (!visible || !message) return null;
    return (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
        </div>
    );
}
