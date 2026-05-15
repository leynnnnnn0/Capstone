<?php

namespace App\Http\Controllers\Customer;

use App\Events\QuotationSigned;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuotationResource;
use App\Models\Quotation;
use App\Services\Customer\CustomerRecordAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomerQuotationSignatureController extends Controller
{
    public function __construct(private readonly CustomerRecordAccess $recordAccess) {}

    public function store(Request $request, Quotation $quotation): JsonResponse
    {
        $quotation->load(['appointment', 'quotation_items.options']);

        abort_unless(
            $quotation->appointment && $this->recordAccess->canAccessAppointment($request->user(), $quotation->appointment),
            404
        );

        $validated = $request->validate([
            'signature' => ['required', 'string'],
            'signer_name' => ['required', 'string', 'max:255'],
        ]);

        abort_if($quotation->quotation_items->where('status', 'approved')->isEmpty(), 422, 'There are no approved quote items to sign.');

        $path = $this->storeSignature($validated['signature'], $quotation->id);

        $quotation->forceFill([
            'customer_signed_at' => now(),
            'customer_signature_name' => $validated['signer_name'],
            'customer_signature_path' => $path,
            'customer_signature_hash' => $quotation->approvedSignatureHash(),
            'customer_signature_ip' => $request->ip(),
            'customer_signature_user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
            'signature_invalidated_at' => null,
            'signature_invalidated_reason' => null,
        ])->save();

        QuotationSigned::dispatch($quotation->fresh(['appointment', 'quotation_items.options']), $request->user());

        return response()->json([
            'message' => 'Quotation signed.',
            'data' => new QuotationResource($quotation->fresh(['appointment', 'quotation_items.options'])),
        ]);
    }

    private function storeSignature(string $dataUrl, int $quotationId): string
    {
        abort_unless(str_starts_with($dataUrl, 'data:image/png;base64,'), 422, 'Signature must be a PNG image.');

        $binary = base64_decode(Str::after($dataUrl, 'data:image/png;base64,'), true);

        abort_unless($binary, 422, 'The signature image is invalid.');

        $path = "quotation-signatures/quotation-{$quotationId}-" . Str::uuid() . '.png';

        Storage::disk('public')->put($path, $binary);

        return $path;
    }
}
