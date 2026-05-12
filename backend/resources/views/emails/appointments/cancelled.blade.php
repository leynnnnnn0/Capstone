<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">

    <h2>Your Appointment is Cancelled</h2>

    <p>Hi {{ $appointment->first_name }},</p>

    <p>Your appointment has been cancelled.</p>

    <p style="color: #d97706; font-weight: bold; margin-top: 10px;">
    Please note: This appointment is still subject to confirmation. One of our representatives will call you to confirm your schedule.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
            <td style="padding: 8px; font-weight: bold;">Reference Number</td>
            <td style="padding: 8px;">{{ $appointment->appointment_number }}</td>
        </tr>
    </table>

    <p>If you have any questions, feel free to contact us.</p>

    <p>Thank you for choosing our service.</p>

</body>
</html>