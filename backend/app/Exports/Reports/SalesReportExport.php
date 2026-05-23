<?php

namespace App\Exports\Reports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class SalesReportExport implements WithMultipleSheets
{
    public function __construct(
        private readonly array $report,
        private readonly bool $singleSheet = false,
    ) {}

    public function sheets(): array
    {
        if ($this->singleSheet) {
            return [
                new SalesPaymentsSheet($this->report),
            ];
        }

        return [
            new SalesSummarySheet($this->report),
            new SalesPaymentsSheet($this->report),
            new SalesOutstandingWorkJobsSheet($this->report),
            new SalesTopProductsSheet($this->report),
        ];
    }
}
