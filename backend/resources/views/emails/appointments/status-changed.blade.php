<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2>Appointment {{ $status->label() }}</h2>

    <p>Hi {{ $appointment->first_name }},</p>

    <p>{{ $statusMessage }}</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
            <td style="padding: 8px; font-weight: bold;">Reference Number</td>
            <td style="padding: 8px;">{{ $appointment->appointment_number }}</td>
        </tr>
        <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold;">Status</td>
            <td style="padding: 8px;">{{ $status->label() }}</td>
        </tr>
        @if($appointment->appointment_date)
            <tr>
                <td style="padding: 8px; font-weight: bold;">Date</td>
                <td style="padding: 8px;">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('F d, Y') }}</td>
            </tr>
        @endif
        @if($appointment->appointment_time_from && $appointment->appointment_time_until)
            <tr style="background: #f9f9f9;">
                <td style="padding: 8px; font-weight: bold;">Time</td>
                <td style="padding: 8px;">
                    {{ \Carbon\Carbon::parse($appointment->appointment_time_from)->format('h:i A') }}
                    –
                    {{ \Carbon\Carbon::parse($appointment->appointment_time_until)->format('h:i A') }}
                </td>
            </tr>
        @endif
    </table>

    <p>If you have any questions, feel free to contact us.</p>

    <p>Thank you for choosing our service.</p>
</body>
</html>
