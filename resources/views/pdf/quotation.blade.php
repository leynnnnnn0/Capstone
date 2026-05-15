<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quotation #{{ $quotation->id }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        gold: {
                            DEFAULT: '#B8860B',
                            light:   '#D4A017',
                            pale:    '#FDF8EC',
                            dark:    '#8B6508',
                        }
                    },
                    fontFamily: {
                        sans:    ['"Poppins"', 'sans-serif'],
                        display: ['"Poppins"', 'serif'],
                    }
                }
            }
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        @media print {
            @page {
                size: A4;
                margin: 16mm 16mm 16mm 16mm;
            }
            html, body {
                width: 210mm;
                background: #fff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page-break { page-break-before: always; }
            .page-wrapper {
                padding: 0 !important;
                max-width: 100% !important;
            }
        }
        .bg-ink   { background-color: #111111 !important; }
        .bg-gold  { background-color: #B8860B !important; }
        .bg-pale  { background-color: #FAFAF8 !important; }
    </style>
</head>
<body class="bg-white text-[#111111]" style="font-family:'Source Sans 3',sans-serif; font-size:10.5px;">
<div class="page-wrapper max-w-[860px] mx-auto px-12 py-10">

    {{-- ══ HEADER ════════════════════════════════════════════════════════════ --}}
    <div class="flex justify-between items-start gap-6 pb-5 mb-7"
         style="border-bottom: 3px solid #B8860B;">
        <div class="flex items-start gap-4">
            <img src="{{ public_path('images/sog-logo.png') }}"
                 alt="SOG Logo"
                 class="w-16 h-16 object-contain shrink-0" />
            <div>
                <div style="font-family:'Poppins',serif; font-size:17px; font-weight:300; letter-spacing:0.5px; line-height:1.2; margin-bottom:5px;">
                    SOG Glass &amp; Aluminum Services
                </div>
                <div style="font-size:9.5px; color:#555555; line-height:1.9;">
                    128 Pasong Kawayan 2, General Trias City, 4107 Cavite<br>
                    Tel: 09125244356 &nbsp;·&nbsp; 09366897991<br>
                    N-VAT Reg. TIN: 478-158-857-000<br>
                    <span style="color:#B8860B;">sogglassandaluminum@gmail.com</span>
                </div>
            </div>
        </div>
        <div class="text-right shrink-0">
            <div style="font-family:'Poppins',serif; font-size:12px; font-weight:500; letter-spacing:4px; color:#111; margin-bottom:10px; text-transform:uppercase;">
                Quotation
            </div>
            <table style="border-collapse:collapse; margin-left:auto; min-width:200px;">
                <thead>
                    <tr>
                        <th class="bg-ink" style="background:#111111 !important; color:#ffffff; padding:5px 16px; font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; border:1px solid #333; text-align:center;">Quote #</th>
                        <th class="bg-ink" style="background:#111111 !important; color:#ffffff; padding:5px 16px; font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; border:1px solid #333; text-align:center;">Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #e5e7eb; padding:7px 16px; text-align:center; font-family:'Poppins',serif; font-weight:700; color:#B8860B; font-size:14px; background:#fff;">
                            {{ $quotation->id }}
                        </td>
                        <td style="border:1px solid #e5e7eb; padding:7px 16px; text-align:center; font-size:10.5px; background:#fff;">
                            {{ $quotation->created_at->format('m/d/Y') }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    {{-- ══ CUSTOMER INFO ══════════════════════════════════════════════════════ --}}
    <div class="flex justify-between items-end gap-6 mb-6">
        <div>
            <div style="font-size:8px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#B8860B; border-bottom:1px solid #e5e7eb; padding-bottom:4px; margin-bottom:8px; width:210px;">
                Customer Information
            </div>
            <div style="line-height:2.0;">
                <div>
                    <span style="font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#777; display:inline-block; width:58px;">Name</span>
                    <span style="font-weight:600;">{{ strtoupper($appointment->full_name) }}</span>
                </div>
                <div>
                    <span style="font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#777; display:inline-block; width:58px;">Phone</span>
                    {{ $appointment->phone_number }}
                </div>
                <div>
                    <span style="font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#777; display:inline-block; width:58px;">Address</span>
                    {{ strtoupper($appointment->address) }}
                </div>
            </div>
        </div>
        <div style="font-size:9.5px; font-style:italic; color:#aaa; border-bottom:1px solid #d1d5db; padding-bottom:4px; white-space:nowrap;">
            Prepared by: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
    </div>

    {{-- ══ LINE ITEMS TABLE ═══════════════════════════════════════════════════ --}}
    <table style="border-collapse:collapse; width:100%; font-size:10.5px; margin-bottom:0;">
        <thead>
            <tr>
                <th class="bg-ink" style="background:#111111 !important; color:#fff; border:1px solid #2a2a2a; padding:8px 6px; font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; text-align:center; width:50px;">Qty.</th>
                <th class="bg-ink" style="background:#111111 !important; color:#fff; border:1px solid #2a2a2a; padding:8px 12px; font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; text-align:left;">Description</th>
                <th class="bg-ink" style="background:#111111 !important; color:#fff; border:1px solid #2a2a2a; padding:8px 6px; font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; text-align:center; width:76px;">Area</th>
                <th class="bg-ink" style="background:#111111 !important; color:#fff; border:1px solid #2a2a2a; padding:8px 12px; font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; text-align:right; width:100px;">Unit Price</th>
                <th class="bg-ink" style="background:#111111 !important; color:#fff; border:1px solid #2a2a2a; padding:8px 12px; font-size:8px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; text-align:right; width:100px;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($quotation->quotation_items as $item)
            <tr style="background:#ffffff;">
                <td style="border:1px solid #e5e7eb; text-align:center; vertical-align:top; padding:10px 6px; font-weight:600; color:#222;">{{ $item->pieces }}</td>
                <td style="border:1px solid #e5e7eb; vertical-align:top; padding:10px 12px;">
                    <div style="font-weight:700; color:#111; letter-spacing:0.2px;">
                        {{ strtoupper($item->name) }}
                        @if($item->description)
                            <span style="font-weight:400; color:#999; font-size:10px; margin-left:4px;">— {{ $item->description }}</span>
                        @endif
                    </div>
                    @foreach ($item->options as $opt)
                        <div style="padding-left:10px; color:#555; line-height:1.85; font-size:10px; margin-top:1px;">
                            · {{ $opt->option_name }}
                            @if(floatval($opt->price_modifier) > 0)
                                <span style="color:#aaa; font-size:9px;">(+₱{{ number_format($opt->price_modifier, 2) }})</span>
                            @endif
                        </div>
                    @endforeach
                    @if($item->width && $item->height)
                        <div style="color:#aaa; font-size:9px; margin-top:3px;">
                            {{ $item->width }} × {{ $item->height }} cm
                            @if($item->thickness) &nbsp;·&nbsp; {{ $item->thickness }} mm @endif
                            @if($item->pieces > 1) &nbsp;·&nbsp; {{ $item->pieces }} pcs @endif
                        </div>
                    @endif
                    @if($item->notes)
                        <div style="color:#aaa; font-style:italic; font-size:9px; margin-top:2px;">{{ $item->notes }}</div>
                    @endif
                </td>
                <td style="border:1px solid #e5e7eb; text-align:center; vertical-align:top; padding:10px 6px; color:#777;">
                    @if($item->width && $item->height)
                        {{ number_format(($item->width * $item->height) / 10000, 2) }} sqm
                    @else
                        Set
                    @endif
                </td>
                <td style="border:1px solid #e5e7eb; text-align:right; vertical-align:top; padding:10px 12px; color:#666;">₱{{ number_format($item->amount_per_piece, 2) }}</td>
                <td style="border:1px solid #e5e7eb; text-align:right; vertical-align:top; padding:10px 12px; font-weight:700; color:#111;">₱{{ number_format($item->total_amount, 2) }}</td>
            </tr>
            @endforeach
            @for ($i = 0; $i < max(0, 4 - count($quotation->quotation_items)); $i++)
            <tr style="background:#ffffff;">
                <td style="border:1px solid #e5e7eb; height:32px;"></td>
                <td style="border:1px solid #e5e7eb;"></td>
                <td style="border:1px solid #e5e7eb;"></td>
                <td style="border:1px solid #e5e7eb;"></td>
                <td style="border:1px solid #e5e7eb;"></td>
            </tr>
            @endfor
        </tbody>
    </table>

    {{-- ══ TOTALS ═════════════════════════════════════════════════════════════ --}}
    <div class="flex justify-end mb-7">
        <table style="border-collapse:collapse; min-width:260px; border-top:none;">
            <tr>
                <td class="bg-pale" style="background:#FAFAF8 !important; border:1px solid #e5e7eb; padding:7px 16px; font-size:8.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#777;">Subtotal</td>
                <td style="border:1px solid #e5e7eb; padding:7px 16px; text-align:right; font-weight:600; color:#222; background:#fff;">₱{{ number_format($subtotal, 2) }}</td>
            </tr>
            @if($quotation->discount > 0)
            <tr>
                <td class="bg-pale" style="background:#FAFAF8 !important; border:1px solid #e5e7eb; padding:7px 16px; font-size:8.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#b91c1c;">Discount</td>
                <td style="border:1px solid #e5e7eb; padding:7px 16px; text-align:right; font-weight:600; color:#b91c1c; background:#fff;">− ₱{{ number_format($quotation->discount, 2) }}</td>
            </tr>
            @endif
            <tr>
                <td class="bg-gold" style="background:#B8860B !important; border:1px solid #8B6508; padding:9px 16px; font-family:'Poppins',serif; font-size:13px; font-weight:700; color:#fff;">Total Quote</td>
                <td class="bg-gold" style="background:#B8860B !important; border:1px solid #8B6508; padding:9px 16px; text-align:right; font-size:14px; font-weight:800; color:#fff;">₱{{ number_format($total, 2) }}</td>
            </tr>
        </table>
    </div>

    {{-- ══ NOTES ══════════════════════════════════════════════════════════════ --}}
    @if($quotation->notes)
    <div style="margin-bottom:20px; padding:10px 14px; border-left:3px solid #B8860B; background:#FDF8EC; color:#555; font-size:10px; line-height:1.8;">
        <strong style="color:#111;">Notes:</strong> {{ $quotation->notes }}
    </div>
    @endif

   

    {{-- ══ FOOTER ══════════════════════════════════════════════════════════════ --}}
    <div style="border-top:1px dashed #e5e7eb; padding-top:12px; margin-bottom:10px;">
     {{-- ══ CLIENT ACCEPTANCE ══════════════════════════════════════════════════ --}}
    <div style="margin-bottom:28px;">
        <div style="font-size:8.5px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#B8860B; margin-bottom:16px;">
            Client Acceptance
        </div>
        <div style="display:flex; gap:24px; align-items:flex-end;">
            <div style="flex:1;">
                <div style="border-bottom:1px solid #111; height:24px; margin-bottom:4px;"></div>
                <div style="font-size:8.5px; color:#aaa; letter-spacing:0.5px;">Printed Name</div>
            </div>
            <div style="width:180px;">
                <div style="border-bottom:1px solid #111; height:24px; margin-bottom:4px;"></div>
                <div style="font-size:8.5px; color:#aaa; letter-spacing:0.5px;">Signature</div>
            </div>
            <div style="width:120px;">
                <div style="border-bottom:1px solid #111; height:24px; margin-bottom:4px;"></div>
                <div style="font-size:8.5px; color:#aaa; letter-spacing:0.5px;">Date</div>
            </div>
        </div>
    </div>
        {{-- Contact line --}}
        <div style="text-align:center; font-style:italic; color:#aaa; font-size:9px; margin-bottom:8px;">
            For inquiries, please contact
            <strong style="color:#555; font-style:normal;">Shirley M. Lambino</strong>
            &nbsp;·&nbsp; 09125244356 &nbsp;·&nbsp; sogglassandaluminum@gmail.com
        </div>
        {{-- Disclaimer --}}
        <div style="text-align:center; font-style:italic; color:#bbb; font-size:8.5px; line-height:1.9;">
            This quotation is not a contract or a bill. It is our best estimate of the total price for the service and goods described above.<br>
            The customer will be billed after indicating acceptance of this quote. Payment is due prior to delivery of service and goods.<br>
            Please return the signed quote to the address listed above.
        </div>
    </div>

    {{-- Gold bar --}}
    <div style="height:5px; background:linear-gradient(to right, #8B6508, #D4A017, #8B6508); border-radius:2px;"></div>
</div>
</body>
</html>