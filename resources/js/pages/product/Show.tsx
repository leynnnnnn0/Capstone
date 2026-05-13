import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import {
    Package,
    Ruler,
    Settings2,
    Plus,
    Trash2,
    Pencil,
    ImageIcon,
    Tag,
    ListChecks,
} from 'lucide-react';

import { calcArea } from './utils/product-form-utils';
import { FieldError, FlashMessage, Lightbox } from './components/product-form-components';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
    id: number;
    name: string;
}
interface ProductOption {
    id: number;
    name: string;
    price_modifier: string;
    is_active: boolean;
    sort_order: number;
}
interface ProductOptionGroup {
    id: number;
    name: string;
    is_required: boolean;
    sort_order: number;
    product_options: ProductOption[];
}
interface ProductVariantImage {
    id: number;
    url: string;
}
interface ProductVariant {
    id: number;
    width: string;
    height: string;
    price: string;
    is_active: boolean;
    product_variant_images: ProductVariantImage[];
}
interface ProductImage {
    id: number;
    url: string;
}
interface Product {
    id: number;
    name: string;
    description: string | null;
    categories: Category[];
    unit: string;
    price_per_unit: string;
    is_active: boolean;
    product_images: ProductImage[];
    product_variants: ProductVariant[];
    product_option_groups: ProductOptionGroup[];
}
interface Props {
    product: Product;
    flash: { success?: string };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Show({ product, flash }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Products', href: '/products' },
        { title: product.name, href: '#' },
    ];

    const [lightbox, setLightbox] = useState<{
        images: { id: number; url: string }[];
        index: number;
    } | null>(null);

    // ── Option Group Form ──────────────────────────────────────────
    const groupForm = useForm({ name: '', is_required: true as boolean });
    const submitGroup = (e: React.FormEvent) => {
        e.preventDefault();
        groupForm.post(`/products/${product.id}/option-groups`, {
            preserveScroll: true,
            onSuccess: () => groupForm.reset(),
        });
    };

    // ── Option Form (per group) ────────────────────────────────────
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const optionForm = useForm({ name: '', price_modifier: '' });
    const submitOption = (e: React.FormEvent, groupId: number) => {
        e.preventDefault();
        optionForm.post(
            `/products/${product.id}/option-groups/${groupId}/options`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    optionForm.reset();
                    setActiveGroupId(null);
                },
            },
        );
    };

    const coverImage = product.product_images[0]?.url;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />

            {lightbox && (
                <Lightbox
                    images={lightbox.images}
                    initialIndex={lightbox.index}
                    onClose={() => setLightbox(null)}
                />
            )}

            <div>
                <div className="mb-4">
                    <FlashMessage message={flash?.success} />
                </div>

                {/* Page Header */}
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-muted"
                            onClick={() =>
                                coverImage &&
                                setLightbox({
                                    images: product.product_images,
                                    index: 0,
                                })
                            }
                        >
                            {coverImage ? (
                                <img
                                    src={coverImage}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Package className="h-7 w-7 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {product.name}
                                </h1>
                                <Badge
                                    variant={
                                        product.is_active
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                                {product.categories.length > 0 ? (
                                    product.categories.map((c) => (
                                        <Badge
                                            key={c.id}
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {c.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        No categories
                                    </span>
                                )}
                                <span>·</span>
                                <span>
                                    ₱
                                    {parseFloat(
                                        product.price_per_unit,
                                    ).toLocaleString()}{' '}
                                    / {product.unit}
                                </span>
                            </div>
                            {product.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {product.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            router.visit(`/admin/products/${product.id}/edit`)
                        }
                    >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit Product
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* ── Product Images ──────────────────────────────── */}
                    {product.product_images.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-base">
                                        Product Images
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Click any image to enlarge.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-6 gap-2">
                                    {product.product_images.map((img, idx) => (
                                        <div
                                            key={img.id}
                                            className="relative aspect-square cursor-pointer overflow-hidden rounded-md border transition-opacity hover:opacity-80"
                                            onClick={() =>
                                                setLightbox({
                                                    images: product.product_images,
                                                    index: idx,
                                                })
                                            }
                                        >
                                            <img
                                                src={img.url}
                                                alt={`img-${idx}`}
                                                className="h-full w-full object-cover"
                                            />
                                            {idx === 0 && (
                                                <div className="absolute right-0 bottom-0 left-0 bg-primary py-0.5 text-center text-[9px] font-semibold text-white">
                                                    COVER
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Variants ────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ruler className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-base">
                                        Variants
                                    </CardTitle>
                                </div>
                                <Badge variant="secondary">
                                    {product.product_variants.length} sizes
                                </Badge>
                            </div>
                            <CardDescription>
                                Standard sizes with fixed prices.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {product.product_variants.length > 0 ? (
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Size (cm)</TableHead>
                                                <TableHead>Area</TableHead>
                                                <TableHead>
                                                    Fixed Price
                                                </TableHead>
                                                <TableHead>Images</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {product.product_variants.map(
                                                (v) => (
                                                    <TableRow key={v.id}>
                                                        <TableCell className="font-medium">
                                                            {v.width} ×{' '}
                                                            {v.height}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {calcArea(
                                                                v.width,
                                                                v.height,
                                                            )}{' '}
                                                            sqm
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                ₱
                                                                {parseFloat(
                                                                    v.price,
                                                                ).toLocaleString()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {v
                                                                .product_variant_images
                                                                .length > 0 ? (
                                                                <div className="flex gap-1">
                                                                    {v.product_variant_images
                                                                        .slice(
                                                                            0,
                                                                            3,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                img,
                                                                                imgIdx,
                                                                            ) => (
                                                                                <img
                                                                                    key={
                                                                                        img.id
                                                                                    }
                                                                                    src={
                                                                                        img.url
                                                                                    }
                                                                                    className="h-7 w-7 cursor-pointer rounded border object-cover transition-opacity hover:opacity-80"
                                                                                    onClick={() =>
                                                                                        setLightbox(
                                                                                            {
                                                                                                images: v.product_variant_images,
                                                                                                index: imgIdx,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                />
                                                                            ),
                                                                        )}
                                                                    {v
                                                                        .product_variant_images
                                                                        .length >
                                                                        3 && (
                                                                        <span
                                                                            className="ml-1 cursor-pointer self-center text-xs underline-offset-2 hover:underline"
                                                                            onClick={() =>
                                                                                setLightbox(
                                                                                    {
                                                                                        images: v.product_variant_images,
                                                                                        index: 3,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            +
                                                                            {v
                                                                                .product_variant_images
                                                                                .length -
                                                                                3}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs">
                                                                    —
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    v.is_active
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {v.is_active
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-sm text-muted-foreground">
                                    <Ruler className="mb-2 h-8 w-8 opacity-30" />
                                    <p>No variants added</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Option Groups ────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">
                                    Option Groups
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Configure material options clients can choose
                                when ordering (e.g. Screen Type, Glass Type,
                                Aluminum Frame).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Option Group Form */}
                            <form
                                onSubmit={submitGroup}
                                className="rounded-lg border bg-muted/40 p-4"
                            >
                                <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Add Option Group
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">
                                            Group Name
                                        </Label>
                                        <Input
                                            placeholder="e.g. Screen Type, Glass Type"
                                            value={groupForm.data.name}
                                            onChange={(e) =>
                                                groupForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className={
                                                groupForm.errors.name
                                                    ? 'border-destructive'
                                                    : ''
                                            }
                                        />
                                        <FieldError
                                            message={groupForm.errors.name}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">
                                            Required?
                                        </Label>
                                        <div className="flex items-center gap-3 pt-1.5">
                                            <Switch
                                                checked={
                                                    groupForm.data.is_required
                                                }
                                                onCheckedChange={(v) =>
                                                    groupForm.setData(
                                                        'is_required',
                                                        v,
                                                    )
                                                }
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {groupForm.data.is_required
                                                    ? 'Client must choose'
                                                    : 'Optional choice'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="mt-3"
                                    disabled={groupForm.processing}
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add Group
                                </Button>
                            </form>

                            {/* Existing Option Groups */}
                            {product.product_option_groups.length > 0 ? (
                                <div className="space-y-4">
                                    {product.product_option_groups.map(
                                        (group) => (
                                            <div
                                                key={group.id}
                                                className="rounded-lg border"
                                            >
                                                {/* Group Header */}
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <ListChecks className="h-4 w-4 text-primary" />
                                                        <span className="text-sm font-semibold">
                                                            {group.name}
                                                        </span>
                                                        <Badge
                                                            variant={
                                                                group.is_required
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {group.is_required
                                                                ? 'Required'
                                                                : 'Optional'}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {
                                                                group
                                                                    .product_options
                                                                    .length
                                                            }{' '}
                                                            option
                                                            {group
                                                                .product_options
                                                                .length !== 1
                                                                ? 's'
                                                                : ''}
                                                        </Badge>
                                                    </div>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete "
                                                                    {group.name}
                                                                    "?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will
                                                                    also delete
                                                                    all{' '}
                                                                    {
                                                                        group
                                                                            .product_options
                                                                            .length
                                                                    }{' '}
                                                                    option
                                                                    {group
                                                                        .product_options
                                                                        .length !==
                                                                    1
                                                                        ? 's'
                                                                        : ''}{' '}
                                                                    inside it.
                                                                    This cannot
                                                                    be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    onClick={() =>
                                                                        router.delete(
                                                                            `/products/${product.id}/option-groups/${group.id}`,
                                                                            {
                                                                                preserveScroll: true,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Delete Group
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>

                                                {/* Options Table */}
                                                {group.product_options.length >
                                                    0 && (
                                                    <div className="border-t">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>
                                                                        Option
                                                                        Name
                                                                    </TableHead>
                                                                    <TableHead>
                                                                        Price
                                                                        Modifier
                                                                    </TableHead>
                                                                    <TableHead className="w-10"></TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {group.product_options.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <TableRow
                                                                            key={
                                                                                option.id
                                                                            }
                                                                        >
                                                                            <TableCell className="text-sm font-medium">
                                                                                {
                                                                                    option.name
                                                                                }
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {parseFloat(
                                                                                    option.price_modifier,
                                                                                ) ===
                                                                                0 ? (
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        No
                                                                                        extra
                                                                                        charge
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="border-green-300 text-xs text-green-600"
                                                                                    >
                                                                                        +₱
                                                                                        {parseFloat(
                                                                                            option.price_modifier,
                                                                                        ).toLocaleString()}
                                                                                    </Badge>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <AlertDialog>
                                                                                    <AlertDialogTrigger
                                                                                        asChild
                                                                                    >
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                                                        >
                                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </AlertDialogTrigger>
                                                                                    <AlertDialogContent>
                                                                                        <AlertDialogHeader>
                                                                                            <AlertDialogTitle>
                                                                                                Remove
                                                                                                "
                                                                                                {
                                                                                                    option.name
                                                                                                }
                                                                                                "?
                                                                                            </AlertDialogTitle>
                                                                                            <AlertDialogDescription>
                                                                                                This
                                                                                                option
                                                                                                will
                                                                                                be
                                                                                                permanently
                                                                                                removed.
                                                                                            </AlertDialogDescription>
                                                                                        </AlertDialogHeader>
                                                                                        <AlertDialogFooter>
                                                                                            <AlertDialogCancel>
                                                                                                Cancel
                                                                                            </AlertDialogCancel>
                                                                                            <AlertDialogAction
                                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                                onClick={() =>
                                                                                                    router.delete(
                                                                                                        `/products/${product.id}/option-groups/${group.id}/options/${option.id}`,
                                                                                                        {
                                                                                                            preserveScroll: true,
                                                                                                        },
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                Remove
                                                                                            </AlertDialogAction>
                                                                                        </AlertDialogFooter>
                                                                                    </AlertDialogContent>
                                                                                </AlertDialog>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ),
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}

                                                {/* Add Option Form / Button */}
                                                <div className="border-t px-4 py-3">
                                                    {activeGroupId ===
                                                    group.id ? (
                                                        <form
                                                            onSubmit={(e) =>
                                                                submitOption(
                                                                    e,
                                                                    group.id,
                                                                )
                                                            }
                                                            className="flex flex-wrap items-end gap-3"
                                                        >
                                                            <div className="min-w-[160px] flex-1 space-y-1.5">
                                                                <Label className="text-xs">
                                                                    Option Name
                                                                </Label>
                                                                <Input
                                                                    placeholder="e.g. Tempered Glass"
                                                                    value={
                                                                        optionForm
                                                                            .data
                                                                            .name
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        optionForm.setData(
                                                                            'name',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className={
                                                                        optionForm
                                                                            .errors
                                                                            .name
                                                                            ? 'border-destructive'
                                                                            : ''
                                                                    }
                                                                />
                                                                <FieldError
                                                                    message={
                                                                        optionForm
                                                                            .errors
                                                                            .name
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="w-40 space-y-1.5">
                                                                <Label className="text-xs">
                                                                    Price
                                                                    Modifier (₱)
                                                                </Label>
                                                                <div className="relative">
                                                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                                                        ₱
                                                                    </span>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        className={`pl-7 ${optionForm.errors.price_modifier ? 'border-destructive' : ''}`}
                                                                        value={
                                                                            optionForm
                                                                                .data
                                                                                .price_modifier
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            optionForm.setData(
                                                                                'price_modifier',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <FieldError
                                                                    message={
                                                                        optionForm
                                                                            .errors
                                                                            .price_modifier
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    disabled={
                                                                        optionForm.processing
                                                                    }
                                                                >
                                                                    <Plus className="mr-1 h-3.5 w-3.5" />{' '}
                                                                    Add
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setActiveGroupId(
                                                                            null,
                                                                        );
                                                                        optionForm.reset();
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground hover:text-foreground"
                                                            onClick={() => {
                                                                setActiveGroupId(
                                                                    group.id,
                                                                );
                                                                optionForm.reset();
                                                            }}
                                                        >
                                                            <Plus className="mr-1.5 h-3.5 w-3.5" />{' '}
                                                            Add Option
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-sm text-muted-foreground">
                                    <Settings2 className="mb-2 h-8 w-8 opacity-30" />
                                    <p>No option groups yet</p>
                                    <p className="text-xs opacity-70">
                                        Add groups like "Screen Type" or "Glass
                                        Type" above
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
