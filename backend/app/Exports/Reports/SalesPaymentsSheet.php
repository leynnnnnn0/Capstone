<?php

namespace App\Exports\Reports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesPaymentsSheet implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    private const HEADINGS = [
        'Payment #',
        'Work Job #',
        'Customer',
        'Phone',
        'Email',
        'Type',
        'Method',
        'Status',
        'Amount',
        'Currency',
        'Provider Capture ID',
        'Recorded At',
    ];

    public function __construct(private readonly array $report) {}

    public function title(): string
    {
        return 'Payments';
    }

    public function headings(): array
    {
        return self::HEADINGS;
    }

    public function array(): array
    {
        return collect($this->report['export_rows'])
            ->map(fn (array $row) => collect(self::HEADINGS)
                ->map(fn (string $heading) => $row[$heading] ?? null)
                ->all())
            ->all();
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle('1:1')->getFont()->setBold(true);

        return [];
    }
}
