<?php

namespace App\Exports\Reports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesOutstandingWorkJobsSheet implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(private readonly array $report) {}

    public function title(): string
    {
        return 'Outstanding';
    }

    public function headings(): array
    {
        return [
            'Work Job #',
            'Customer',
            'Status',
            'Schedule',
            'Payable Total',
            'Paid Amount',
            'Remaining Amount',
            'Next Due Type',
            'Next Due Amount',
        ];
    }

    public function array(): array
    {
        return collect($this->report['tables']['outstanding_work_jobs'])
            ->map(fn (array $row) => [
                $row['work_job_number'],
                $row['customer'],
                $row['status_label'],
                $row['schedule'],
                $row['payable_total'],
                $row['paid_amount'],
                $row['remaining_amount'],
                $row['next_due_type'],
                $row['next_due_amount'],
            ])
            ->all();
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle('1:1')->getFont()->setBold(true);

        return [];
    }
}
