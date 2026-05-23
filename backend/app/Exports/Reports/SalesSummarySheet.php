<?php

namespace App\Exports\Reports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesSummarySheet implements FromArray, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(private readonly array $report) {}

    public function title(): string
    {
        return 'Summary';
    }

    public function array(): array
    {
        $summary = $this->report['summary'];
        $filters = $this->report['filters'];

        return [
            ['SOG Glass & Aluminum Sales Report'],
            ['Generated At', now()->format('Y-m-d H:i:s')],
            [],
            ['Metric', 'Value'],
            ['Net Sales', $summary['net_sales']],
            ['Gross Paid Sales', $summary['gross_sales']],
            ['Pending Amount', $summary['pending_amount']],
            ['Outstanding Amount', $summary['outstanding_amount']],
            ['Refunded Amount', $summary['refunded_amount']],
            ['Additional Charges Paid', $summary['additional_charges_paid']],
            ['Average Payment', $summary['average_payment']],
            ['Collection Rate', "{$summary['collection_rate']}%"],
            ['Paid Payments', $summary['paid_count']],
            ['Pending Payments', $summary['pending_count']],
            ['Failed Payments', $summary['failed_count']],
            ['Refunded Payments', $summary['refunded_count']],
            [],
            ['Filter', 'Value'],
            ['Date From', $filters['date_from'] ?: 'All'],
            ['Date To', $filters['date_to'] ?: 'All'],
            ['Grouped By', ucfirst($filters['group_by'] ?? 'day')],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->mergeCells('A1:B1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A4:B4')->getFont()->setBold(true);
        $sheet->getStyle('A18:B18')->getFont()->setBold(true);

        return [];
    }
}
