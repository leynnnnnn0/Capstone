<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2>Fabrication Progress Updated</h2>
    <p>Hi {{ $workJob->first_name }},</p>
    <p>{{ $statusMessage }}</p>
    <p><strong>Reference number:</strong> {{ $workJob->work_job_number }}</p>
    <p><strong>Current stage:</strong> {{ $status->label() }}</p>
    @if($workJob->fabrication_expected_completion_date)
        <p><strong>Expected completion:</strong> {{ \Carbon\Carbon::parse($workJob->fabrication_expected_completion_date)->format('F d, Y') }}</p>
    @endif
    <p>If you have any questions, please contact us.</p>
</body>
</html>
