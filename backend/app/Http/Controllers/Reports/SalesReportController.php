<?php

namespace App\Http\Controllers\Reports;

use App\Exports\Reports\SalesReportExport;
use App\Http\Controllers\Controller;
use App\Services\Pdf\BrowsershotConfigurator;
use App\Services\Reports\SalesReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Spatie\LaravelPdf\Facades\Pdf;

class SalesReportController extends Controller
{
    public function __construct(private readonly SalesReportService $reports) {}

    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('reports.view'), 403);

        return response()->json($this->reports->build($this->filters($request)));
    }

    public function export(Request $request, string $format)
    {
        abort_unless($request->user()?->can('reports.view'), 403);

        $report = $this->reports->build($this->filters($request));
        $filename = 'sog-sales-report-' . now()->format('Y-m-d');

        return match ($format) {
            'csv' => Excel::download(
                new SalesReportExport($report, singleSheet: true),
                "{$filename}.csv",
                ExcelWriter::CSV
            ),
            'xlsx' => Excel::download(new SalesReportExport($report), "{$filename}.xlsx"),
            'pdf' => Pdf::view('pdf.sales-report', [
                'report' => $report,
                'generatedAt' => now(),
            ])
                ->format('a4')
                ->margins(12, 12, 12, 12)
                ->withBrowsershot(fn ($browsershot) => app(BrowsershotConfigurator::class)->configure($browsershot))
                ->download("{$filename}.pdf"),
            default => abort(404),
        };
    }

    private function filters(Request $request): array
    {
        return [
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'group_by' => $request->string('group_by')->toString() === 'month' ? 'month' : 'day',
        ];
    }
}
