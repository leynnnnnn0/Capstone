<?php

namespace App\Exports\Reports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesTopProductsSheet implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(private readonly array $report) {}

    public function title(): string
    {
        return 'Top Products';
    }

    public function headings(): array
    {
        return [
            'Product',
            'Revenue',
            'Pieces',
            'Line Count',
        ];
    }

    public function array(): array
    {
        return collect($this->report['charts']['top_products'])
            ->map(fn (array $row) => [
                $row['name'],
                $row['revenue'],
                $row['pieces'],
                $row['line_count'],
            ])
            ->all();
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle('1:1')->getFont()->setBold(true);

        return [];
    }
}
