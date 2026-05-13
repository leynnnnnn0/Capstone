import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useCallback, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
    Search,
    SlidersHorizontal,
    RotateCcw,
    Plus,
    Package,
    Layers,
    ToggleLeft,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    ImageOff,
} from 'lucide-react';
import Pagination from '@/components/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
    id: number;
    name: string;
    category: string;
    unit: string;
    price_per_unit: string;
    is_active: boolean;
    cover_image: string | null;
    variants_count: number;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    search?: string;
    category?: string;
    status?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    per_page?: number;
}

interface Props {
    products: PaginatedProducts;
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Products', href: '/products' },
];

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All Categories' },
    { value: 'glass', label: 'Glass' },
    { value: 'door', label: 'Door' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'aluminum', label: 'Aluminum' },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const CATEGORY_COLORS: Record<string, string> = {
    glass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    door: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    cabinet:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    aluminum:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({
    column,
    sortBy,
    sortDir,
}: {
    column: string;
    sortBy?: string;
    sortDir?: string;
}) {
    if (sortBy !== column)
        return (
            <ChevronsUpDown className="ml-1 inline size-3.5 text-muted-foreground/50" />
        );
    return sortDir === 'asc' ? (
        <ChevronUp className="ml-1 inline size-3.5 text-primary" />
    ) : (
        <ChevronDown className="ml-1 inline size-3.5 text-primary" />
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    icon: any;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg leading-tight font-semibold">{value}</p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Index({ products, filters = {} }: Props) {
    const [localSearch, setLocalSearch] = useState(filters.search ?? '');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const hasActiveFilters =
        (filters.search && filters.search !== '') ||
        (filters.category && filters.category !== 'all') ||
        (filters.status && filters.status !== 'all');

    // ── Navigation helper ──────────────────────────────────────────────
    const applyFilter = useCallback(
        (newFilters: Partial<Filters>) => {
            router.get(
                '/admin/products',
                { ...filters, ...newFilters, page: 1 },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    // ── Debounced search ───────────────────────────────────────────────
    const debouncedSearch = useDebouncedCallback((value: string) => {
        applyFilter({ search: value });
    }, 400);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    // ── Reset ──────────────────────────────────────────────────────────
    const handleReset = () => {
        setLocalSearch('');
        router.get('/products', {}, { preserveState: false, replace: true });
    };

    // ── Stat counts ────────────────────────────────────────────────────
    const totalActive = products.data.filter((p) => p.is_active).length;
    const totalInactive = products.data.filter((p) => !p.is_active).length;
    const totalVariants = products.data.reduce(
        (sum, p) => sum + p.variants_count,
        0,
    );

    // ──────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <TooltipProvider>
                <div className="space-y-4 p-1">
                    {/* ── Header ──────────────────────────────────────── */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Products
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {products.total} total product
                                {products.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => router.visit('/products/create')}
                        >
                            <Plus className="size-3.5" />
                            New Product
                        </Button>
                    </div>

                    {/* ── Stat Cards ──────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            label="Total Products"
                            value={products.total}
                            icon={Package}
                        />
                        <StatCard
                            label="Active"
                            value={totalActive}
                            icon={ToggleLeft}
                        />
                        <StatCard
                            label="Inactive"
                            value={totalInactive}
                            icon={ToggleLeft}
                        />
                        <StatCard
                            label="Total Variants"
                            value={totalVariants}
                            icon={Layers}
                        />
                    </div>

                    {/* ── Filters Bar ─────────────────────────────────── */}
                    <div className="rounded-lg border bg-card p-3">
                        <div className="flex flex-col gap-3">
                            {/* Row 1: search + toggle */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or category…"
                                        className="pl-8 text-sm"
                                        value={localSearch}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <Button
                                    variant={
                                        isFiltersOpen ? 'secondary' : 'outline'
                                    }
                                    size="sm"
                                    className="shrink-0 gap-1.5"
                                    onClick={() => setIsFiltersOpen((p) => !p)}
                                >
                                    <SlidersHorizontal className="size-3.5" />
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                                            !
                                        </span>
                                    )}
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0 gap-1.5 text-muted-foreground"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw className="size-3.5" />
                                        Reset
                                    </Button>
                                )}
                            </div>

                            {/* Row 2: expanded filters */}
                            {isFiltersOpen && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {/* Category */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Category
                                            </label>
                                            <Select
                                                value={
                                                    filters.category ?? 'all'
                                                }
                                                onValueChange={(v) =>
                                                    applyFilter({ category: v })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-full text-sm">
                                                    <SelectValue placeholder="Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CATEGORY_OPTIONS.map(
                                                        (o) => (
                                                            <SelectItem
                                                                key={o.value}
                                                                value={o.value}
                                                            >
                                                                {o.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Status
                                            </label>
                                            <Select
                                                value={filters.status ?? 'all'}
                                                onValueChange={(v) =>
                                                    applyFilter({ status: v })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-full text-sm">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((o) => (
                                                        <SelectItem
                                                            key={o.value}
                                                            value={o.value}
                                                        >
                                                            {o.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Per page */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Per Page
                                            </label>
                                            <Select
                                                value={String(
                                                    filters.per_page ?? 10,
                                                )}
                                                onValueChange={(v) =>
                                                    applyFilter({
                                                        per_page: Number(v),
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-full text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PER_PAGE_OPTIONS.map(
                                                        (n) => (
                                                            <SelectItem
                                                                key={n}
                                                                value={String(
                                                                    n,
                                                                )}
                                                            >
                                                                {n} per page
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Table ───────────────────────────────────────── */}
                    <div className="overflow-hidden rounded-lg border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-14">
                                        Image
                                    </TableHead>
                                    <TableHead>
                                    Name
                                    </TableHead>
                                    <TableHead
                                       
                                    >
                                        Price / Unit
                                    
                                    </TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Variants</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-12">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.length > 0 ? (
                                    products.data.map((product) => (
                                        <TableRow key={product.id}>
                                            {/* Cover Image */}
                                            <TableCell>
                                                <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                                    {product.cover_image ? (
                                                        <img
                                                            src={
                                                                product.cover_image
                                                            }
                                                            alt={product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageOff className="size-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Name */}
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>


                                            {/* Price */}
                                            <TableCell className="font-medium">
                                                ₱
                                                {parseFloat(
                                                    product.price_per_unit,
                                                ).toLocaleString()}
                                            </TableCell>

                                            {/* Unit */}
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground uppercase">
                                                    {product.unit}
                                                </span>
                                            </TableCell>

                                            {/* Variants count */}
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {product.variants_count}{' '}
                                                    size
                                                    {product.variants_count !==
                                                    1
                                                        ? 's'
                                                        : ''}
                                                </Badge>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        product.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {product.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/admin/products/${product.id}`,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="mr-2 size-3.5" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/admin/products/${product.id}/edit`,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="mr-2 size-3.5" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                if (
                                                                    confirm(
                                                                        `Delete "${product.name}"? This cannot be undone.`,
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/admin/products/${product.id}`,
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 size-3.5" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="size-10 text-muted-foreground opacity-30" />
                                                <p className="text-sm text-muted-foreground">
                                                    No products found.
                                                </p>
                                                {hasActiveFilters && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleReset}
                                                    >
                                                        <RotateCcw className="mr-1.5 size-3.5" />
                                                        Clear filters
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <Pagination data={products}/>
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}
