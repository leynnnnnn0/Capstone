<?php
// app/Http/Requests/Quotations/UpdateQuotationRequest.php

namespace App\Http\Requests\Quotations;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes'    => ['nullable', 'string', 'max:2000'],
            'discount' => ['nullable', 'numeric', 'min:0'],

            'items'                                               => ['required', 'array', 'min:1'],
            'items.*.product_id'                                  => ['required', 'integer', 'exists:products,id'],
            'items.*.name'                                        => ['required', 'string', 'max:255'],
            'items.*.description'                                 => ['nullable', 'string', 'max:500'],
            'items.*.width'                                       => ['nullable', 'numeric', 'min:0'],
            'items.*.height'                                      => ['nullable', 'numeric', 'min:0'],
            'items.*.thickness'                                   => ['nullable', 'numeric', 'min:0'],
            'items.*.pieces'                                      => ['required', 'integer', 'min:1'],
            'items.*.amount_per_piece'                            => ['required', 'numeric', 'min:0'],
            'items.*.options_amount'                              => ['nullable', 'numeric', 'min:0'],
            'items.*.total_amount'                                => ['required', 'numeric', 'min:0'],
            'items.*.notes'                                       => ['nullable', 'string', 'max:1000'],
            'items.*.selected_options'                            => ['nullable', 'array'],
            'items.*.selected_options.*.product_option_group_id' => ['required', 'integer', 'exists:product_option_groups,id'],
            'items.*.selected_options.*.product_option_id'       => ['required', 'integer', 'exists:product_options,id'],
            'items.*.selected_options.*.group_name'              => ['required', 'string'],
            'items.*.selected_options.*.option_name'             => ['required', 'string'],
            'items.*.selected_options.*.price_modifier'          => ['required', 'numeric'],
        ];
    }
}
