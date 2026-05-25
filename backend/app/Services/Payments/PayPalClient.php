<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\PaymentRefund;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalClient
{
    public function configured(): bool
    {
        return filled($this->clientId()) && filled($this->clientSecret());
    }

    public function clientId(): ?string
    {
        return config('paypal.client_id');
    }

    public function currency(): string
    {
        return config('paypal.currency', 'PHP');
    }

    public function mode(): string
    {
        return config('paypal.mode', 'sandbox');
    }

    /**
     * @throws RequestException
     */
    public function createOrder(Payment $payment): array
    {
        $response = Http::withToken($this->accessToken())
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'PayPal-Request-Id' => "payment-{$payment->id}-create",
            ])
            ->post($this->baseUrl() . '/v2/checkout/orders', [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'reference_id' => $payment->payment_number,
                    'custom_id' => (string) $payment->id,
                    'description' => "{$payment->type->label()} for {$payment->workJob->work_job_number}",
                    'amount' => [
                        'currency_code' => $payment->currency,
                        'value' => number_format((float) $payment->amount, 2, '.', ''),
                    ],
                ]],
            ]);

        $this->throwIfFailed($response, 'create_order', [
            'payment_id' => $payment->id,
        ]);

        return $response->json();
    }

    /**
     * @throws RequestException
     */
    public function captureOrder(string $orderId, ?Payment $payment = null): array
    {
        $response = Http::withToken($this->accessToken())
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'PayPal-Request-Id' => $payment ? "payment-{$payment->id}-capture" : "capture-{$orderId}",
            ])
            ->post($this->baseUrl() . "/v2/checkout/orders/{$orderId}/capture", new \stdClass());

        $this->throwIfFailed($response, 'capture_order', [
            'payment_id' => $payment?->id,
            'order_id' => $orderId,
        ]);

        return $response->json();
    }

    /**
     * @throws RequestException
     */
    public function refundCapture(Payment $payment, PaymentRefund $refund): array
    {
        $response = Http::withToken($this->accessToken())
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'PayPal-Request-Id' => "payment-{$payment->id}-refund-{$refund->id}",
            ])
            ->post($this->baseUrl() . "/v2/payments/captures/{$payment->provider_capture_id}/refund", [
                'amount' => [
                    'currency_code' => $payment->currency,
                    'value' => number_format((float) $refund->amount, 2, '.', ''),
                ],
                'note_to_payer' => str((string) ($refund->reason ?: "Refund for {$payment->payment_number}"))->limit(255, '')->toString(),
            ]);

        $this->throwIfFailed($response, 'refund_capture', [
            'payment_id' => $payment->id,
            'refund_id' => $refund->id,
        ]);

        return $response->json();
    }

    /**
     * @throws RequestException
     */
    private function accessToken(): string
    {
        return Cache::remember('paypal_access_token_' . $this->mode(), now()->addMinutes(50), function () {
            $response = Http::asForm()
                ->withBasicAuth($this->clientId(), $this->clientSecret())
                ->post($this->baseUrl() . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials',
                ]);

            $response->throw();

            return $response->json('access_token');
        });
    }

    private function clientSecret(): ?string
    {
        return config('paypal.client_secret');
    }

    private function baseUrl(): string
    {
        $mode = $this->mode();

        return config("paypal.base_urls.{$mode}", config('paypal.base_urls.sandbox'));
    }

    /**
     * @throws RequestException
     */
    private function throwIfFailed(Response $response, string $action, array $context = []): void
    {
        if ($response->failed()) {
            Log::warning('PayPal request failed.', [
                ...$context,
                'action' => $action,
                'mode' => $this->mode(),
                'status' => $response->status(),
                'response' => $response->json() ?? $response->body(),
            ]);
        }

        $response->throw();
    }
}
