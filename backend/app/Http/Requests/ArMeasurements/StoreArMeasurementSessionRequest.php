<?php

namespace App\Http\Requests\ArMeasurements;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreArMeasurementSessionRequest extends FormRequest
{
    private const MAX_DEVICE_METADATA_BYTES = 32_768;

    private const MAX_OBJECT_METADATA_BYTES = 16_384;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'appointment_id' => ['required', 'integer', 'exists:appointments,id'],
            'capture_version' => ['required', Rule::in(['v1', 'v2', 'v3'])],
            'capture_mode' => ['required', 'string', 'max:50'],
            'overall_confidence' => ['required', Rule::in(['none', 'weak', 'medium', 'high'])],
            'captured_at' => ['required', 'date', 'before_or_equal:'.now()->addMinutes(5)->toIso8601String()],
            'device_metadata' => ['nullable', 'array'],

            'objects' => ['required', 'array', 'min:1', 'max:50'],
            'objects.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'objects.*.object_type' => [
                'required',
                Rule::in(['door', 'window', 'cabinet', 'shower', 'other']),
            ],
            'objects.*.model_id' => ['nullable', 'string', 'max:150'],
            'objects.*.label' => ['required', 'string', 'max:150'],
            'objects.*.segments_cm' => ['required', 'array', 'min:1', 'max:20'],
            'objects.*.segments_cm.*' => ['required', 'numeric', 'min:0.1', 'max:2000'],
            'objects.*.width_cm' => ['required', 'numeric', 'min:0.1', 'max:2000'],
            'objects.*.height_cm' => ['required', 'numeric', 'min:0.1', 'max:1000'],
            'objects.*.depth_cm' => ['nullable', 'numeric', 'min:0.1', 'max:1000'],
            'objects.*.confidence' => [
                'nullable',
                Rule::in(['none', 'weak', 'medium', 'high']),
            ],
            'objects.*.points_count' => ['nullable', 'integer', 'min:2', 'max:100'],
            'objects.*.metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $deviceMetadata = $this->input('device_metadata');

            if (
                is_array($deviceMetadata)
                && $this->jsonSize($deviceMetadata) > self::MAX_DEVICE_METADATA_BYTES
            ) {
                $validator->errors()->add(
                    'device_metadata',
                    'The device metadata may not exceed 32 KB.'
                );
            }

            foreach ((array) $this->input('objects', []) as $index => $object) {
                if (! is_array($object)) {
                    continue;
                }

                $metadata = $object['metadata'] ?? null;
                if (
                    is_array($metadata)
                    && $this->jsonSize($metadata) > self::MAX_OBJECT_METADATA_BYTES
                ) {
                    $validator->errors()->add(
                        "objects.{$index}.metadata",
                        'The object metadata may not exceed 16 KB.'
                    );
                }

                $segments = $object['segments_cm'] ?? null;
                $width = $object['width_cm'] ?? null;

                if (! is_array($segments) || ! is_numeric($width)) {
                    continue;
                }

                $segmentTotal = array_sum(array_filter($segments, 'is_numeric'));
                $allowedDifference = max(1.0, ((float) $width) * 0.02);

                if (abs($segmentTotal - (float) $width) > $allowedDifference) {
                    $validator->errors()->add(
                        "objects.{$index}.width_cm",
                        'The width must match the total of the measured segments.'
                    );
                }
            }
        });
    }

    private function jsonSize(array $value): int
    {
        $encoded = json_encode($value);

        return $encoded === false ? PHP_INT_MAX : strlen($encoded);
    }
}
