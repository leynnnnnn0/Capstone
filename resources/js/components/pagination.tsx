import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationMeta {
    links: PaginationLink[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface PaginationProps {
    data: PaginationMeta;
}

export default function Pagination({ data }: PaginationProps) {
    const { from, to, total, current_page, last_page } = data;

    if (last_page <= 1) return null;

    const handlePageChange = (page: number) => {
        if (page < 1 || page > last_page || page === current_page) return;

        // Construct URL with page parameter - adjust based on your routing
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());

        router.get(
            url.toString(),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    // Generate smart page numbers based on screen size
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        // Always show first page
        pages.push(1);

        // Show current page if it's not first or last
        if (current_page > 2 && current_page < last_page - 1) {
            if (current_page > 3) {
                pages.push('...');
            }
            if (current_page > 2) {
                pages.push(current_page);
            }
        }

        // Show ellipsis before last page if needed
        if (current_page < last_page - 2) {
            pages.push('...');
        }

        // Always show last page if there's more than one page
        if (last_page > 1) {
            pages.push(last_page);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col items-center justify-between gap-3 px-2 py-4 sm:flex-row sm:gap-4">
            {/* Results info */}
            <div className="order-2 text-xs text-muted-foreground sm:order-1 sm:text-sm">
                Showing <span className="font-medium">{from}</span> to{' '}
                <span className="font-medium">{to}</span> of{' '}
                <span className="font-medium">{total}</span> results
            </div>

            {/* Pagination controls */}
            <div className="order-1 flex items-center gap-1 sm:order-2">
                {/* First page - Hidden on mobile */}
                <Button
                    variant="outline"
                    size="icon"
                    className="hidden h-8 w-8 sm:inline-flex"
                    onClick={() => handlePageChange(1)}
                    disabled={current_page === 1}
                    aria-label="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous page */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(current_page - 1)}
                    disabled={current_page === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-1 text-sm text-muted-foreground sm:px-2"
                                >
                                    ...
                                </span>
                            );
                        }

                        const pageNum = page as number;
                        const isActive = pageNum === current_page;

                        return (
                            <Button
                                key={pageNum}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 min-w-[32px] px-2 text-xs sm:px-3 sm:text-sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isActive}
                                aria-label={`Page ${pageNum}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                </div>

                {/* Next page */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(current_page + 1)}
                    disabled={current_page === last_page}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last page - Hidden on mobile */}
                <Button
                    variant="outline"
                    size="icon"
                    className="hidden h-8 w-8 sm:inline-flex"
                    onClick={() => handlePageChange(last_page)}
                    disabled={current_page === last_page}
                    aria-label="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
