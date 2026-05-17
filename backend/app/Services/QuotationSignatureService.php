<?php

namespace App\Services;

use App\Events\QuotationSigned;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QuotationSignatureService
{
    public function sign(Quotation $quotation, array $data, Request $request, ?User $actor = null): Quotation
    {
        $quotation->loadMissing(['appointment', 'quotation_items.options']);

        abort_if(
            $quotation->quotation_items->where('status', 'approved')->isEmpty(),
            422,
            'There are no approved quote items to sign.'
        );

        $quotation->forceFill([
            'customer_signed_at' => now(),
            'customer_signature_name' => $data['signer_name'],
            'customer_signature_path' => $this->storeSignature($data['signature'], $quotation->id),
            'customer_signature_hash' => $quotation->approvedSignatureHash(),
            'customer_signature_ip' => $request->ip(),
            'customer_signature_user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
            'signature_invalidated_at' => null,
            'signature_invalidated_reason' => null,
        ])->save();

        $quotation = $quotation->fresh(['appointment', 'quotation_items.options']);

        QuotationSigned::dispatch($quotation, $actor);

        return $quotation;
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
