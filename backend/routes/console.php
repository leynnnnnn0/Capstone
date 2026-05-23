<?php

use App\Services\Customer\CustomerRecordOwnershipBackfill;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('customers:backfill-record-owners', function (CustomerRecordOwnershipBackfill $backfill) {
    $summary = $backfill->run();

    $this->info('Customer record ownership backfill complete.');
    $this->line("Appointments linked: {$summary['appointments_linked']}");
    $this->line("Work jobs linked: {$summary['work_jobs_linked']}");
    $this->line("Work jobs inherited from appointment: {$summary['work_jobs_inherited_from_appointment']}");
    $this->line("Work jobs inherited from parent: {$summary['work_jobs_inherited_from_parent']}");
    $this->line("Customer accounts created: {$summary['customers_created']}");

    if ($summary['skipped'] === []) {
        $this->line('Skipped records: 0');

        return 0;
    }

    $this->warn('Skipped records: ' . count($summary['skipped']));

    foreach ($summary['skipped'] as $record) {
        $this->line("- {$record['type']} #{$record['id']}: {$record['reason']}");
    }

    return 0;
})->purpose('Assign legacy appointments and work jobs to customer accounts');
