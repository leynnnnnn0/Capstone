@php
    $summary = $report['summary'];
    $filters = $report['filters'];
    $money = fn ($value) => 'PHP ' . number_format((float) $value, 2);
    $date = fn ($value) => $value ? \Carbon\CarbonImmutable::parse($value)->format('M j, Y g:i A') : '-';
@endphp

<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>SOG Sales Report</title>
    <style>
        @page { margin: 16mm 14mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #111827;
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.45;
        }
        h1, h2, h3, p { margin: 0; }
        h1 { font-size: 24px; letter-spacing: -0.02em; }
        h2 {
            margin-bottom: 8px;
            color: #608DB9;
            font-size: 12px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
        }
        .muted { color: #6b7280; }
        .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 2px solid #608DB9;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }
        .filters {
            color: #475569;
            text-align: right;
            white-space: nowrap;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 20px;
        }
        .card {
            border: 1px solid #dbe3ee;
            border-radius: 8px;
            padding: 10px;
        }
        .card .label {
            color: #64748b;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }
        .card .value {
            margin-top: 4px;
            font-size: 15px;
            font-weight: 700;
        }
        section { margin-bottom: 20px; break-inside: avoid; }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border-bottom: 1px solid #e2e8f0;
            padding: 7px 6px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background: #f8fafc;
            color: #475569;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .right { text-align: right; }
        .pill {
            display: inline-block;
            border: 1px solid #bfdbfe;
            border-radius: 999px;
            color: #2563eb;
            padding: 1px 7px;
            font-size: 9px;
            font-weight: 700;
        }
        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 9px;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <header class="header">
        <div>
            <h1>Sales Report</h1>
            <p class="muted">SOG Glass & Aluminum</p>
            <p class="muted">Generated {{ $generatedAt->format('M j, Y g:i A') }}</p>
        </div>
        <div class="filters">
            <div><strong>From:</strong> {{ $filters['date_from'] ?: 'All' }}</div>
            <div><strong>To:</strong> {{ $filters['date_to'] ?: 'All' }}</div>
            <div><strong>Grouped:</strong> {{ ucfirst($filters['group_by'] ?? 'day') }}</div>
        </div>
    </header>

    <section class="summary">
        <div class="card"><div class="label">Net Sales</div><div class="value">{{ $money($summary['net_sales']) }}</div></div>
        <div class="card"><div class="label">Paid Sales</div><div class="value">{{ $money($summary['gross_sales']) }}</div></div>
        <div class="card"><div class="label">Outstanding</div><div class="value">{{ $money($summary['outstanding_amount']) }}</div></div>
        <div class="card"><div class="label">Collection Rate</div><div class="value">{{ number_format($summary['collection_rate'], 1) }}%</div></div>
        <div class="card"><div class="label">Pending</div><div class="value">{{ $money($summary['pending_amount']) }}</div></div>
        <div class="card"><div class="label">Refunded</div><div class="value">{{ $money($summary['refunded_amount']) }}</div></div>
        <div class="card"><div class="label">Extra Charges Paid</div><div class="value">{{ $money($summary['additional_charges_paid']) }}</div></div>
        <div class="card"><div class="label">Average Payment</div><div class="value">{{ $money($summary['average_payment']) }}</div></div>
    </section>

    <section>
        <h2>Recent Payments</h2>
        <table>
            <thead>
                <tr>
                    <th>Payment</th>
                    <th>Work Job</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th class="right">Amount</th>
                    <th>Recorded</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($report['tables']['recent_payments'] as $payment)
                    <tr>
                        <td>{{ $payment['payment_number'] }}</td>
                        <td>{{ $payment['work_job_number'] ?: '-' }}</td>
                        <td>{{ $payment['customer'] ?: $payment['email'] ?: '-' }}</td>
                        <td>{{ $payment['type_label'] }}<br><span class="muted">{{ $payment['method_label'] }}</span></td>
                        <td><span class="pill">{{ $payment['status_label'] }}</span></td>
                        <td class="right">{{ $money($payment['amount']) }}</td>
                        <td>{{ $date($payment['recorded_at']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="muted">No payments found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </section>

    <div class="two-col">
        <section>
            <h2>Top Products</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th class="right">Revenue</th>
                        <th class="right">Pieces</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($report['charts']['top_products'] as $product)
                        <tr>
                            <td>{{ $product['name'] }}</td>
                            <td class="right">{{ $money($product['revenue']) }}</td>
                            <td class="right">{{ $product['pieces'] }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="3" class="muted">No product revenue yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </section>

        <section>
            <h2>Outstanding Work Jobs</h2>
            <table>
                <thead>
                    <tr>
                        <th>Work Job</th>
                        <th>Customer</th>
                        <th class="right">Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($report['tables']['outstanding_work_jobs'] as $workJob)
                        <tr>
                            <td>{{ $workJob['work_job_number'] }}<br><span class="muted">{{ $workJob['status_label'] }}</span></td>
                            <td>{{ $workJob['customer'] }}</td>
                            <td class="right">{{ $money($workJob['remaining_amount']) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="3" class="muted">No outstanding balances.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </section>
    </div>

    <footer class="footer">
        This report is generated from payment records and work job balances in SOG Glass & Aluminum.
    </footer>
</body>
</html>
