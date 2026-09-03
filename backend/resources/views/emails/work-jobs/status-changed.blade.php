<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2>Work Job {{ $status->label() }}</h2>
    <p>Hi {{ $workJob->first_name }},</p>
    <p>{{ $statusMessage }}</p>
    <p><strong>Reference number:</strong> {{ $workJob->work_job_number }}</p>
    <p><strong>Status:</strong> {{ $status->label() }}</p>
    <p>If you have any questions, please contact us.</p>
</body>
</html>
