<?php
// app/Http/Requests/Products/UpdateProductRequest.php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['sometimes', 'string', 'max:255'],
            'description'    => ['sometimes', 'string'],
            'unit'           => ['sometimes', 'string', 'in:sqm,meter,piece,set'],
            'price_per_unit' => ['sometimes', 'numeric', 'min:0'],
            'is_active'      => ['sometimes', 'boolean'],
            'category_ids'   => ['sometimes', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'unit.in'        => 'Unit must be one of: sqm, meter, piece, set.',
            'price_per_unit.min' => 'Price cannot be negative.',
        ];
    }
}
