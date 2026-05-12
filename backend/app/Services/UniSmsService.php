<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UniSmsService
{
    protected string $secretKey;
    protected string $apiUrl = 'https://unismsapi.com/api/sms';

    public function __construct()
    {
        $this->secretKey = config('services.unisms.secret_key');
    }

    public function send(string $recipient, string $message): bool
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->post($this->apiUrl, [
                'recipient' => $recipient,
                'content'   => $message,
            ]);

        if ($response->failed()) {
            Log::error('UniSMS failed', [
                'status'    => $response->status(),
                'body'      => $response->body(),
                'recipient' => $recipient,
            ]);
            return false;
        }

        return true;
    }
}
