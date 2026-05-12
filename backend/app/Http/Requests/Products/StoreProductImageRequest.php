<?php
// app/Http/Requests/Products/StoreProductImageRequest.php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'images'   => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'images.required' => 'Please upload at least one image.',
            'images.max'      => 'You can upload a maximum of 10 images at once.',
            'images.*.image'  => 'Each file must be a valid image.',
            'images.*.mimes'  => 'Images must be jpg, jpeg, png, or webp.',
            'images.*.max'    => 'Each image must not exceed 5MB.',
        ];
    }
}
