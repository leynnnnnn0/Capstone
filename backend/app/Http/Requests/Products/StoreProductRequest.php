<?php
namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ── Product Core ──────────────────────────────────
            'name'            => ['required', 'string', 'max:255'],
            'description'     => ['required', 'string'],
            'unit'            => ['required', 'string', 'in:sqm,meter,piece,set'],
            'price_per_unit'  => ['required', 'numeric', 'min:0'],
            'is_active'       => ['sometimes', 'boolean'],

            // ── Categories ────────────────────────────────────
            'category_ids'    => ['sometimes', 'array'],
            'category_ids.*'  => ['integer', 'exists:categories,id'],

            // ── Product Images ────────────────────────────────
            'images'          => ['sometimes', 'array', 'max:10'],
            'images.*'        => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],

            // ── Product 3D Model ──────────────────────────────
            'model_3d'        => [
                'sometimes',
                'file',
                'extensions:glb,gltf',
                'mimetypes:model/gltf-binary,model/gltf+json,application/octet-stream,application/json,text/plain',
                'max:51200',
            ],

            // ── Variants ──────────────────────────────────────
            'variants'              => ['sometimes', 'array'],
            'variants.*.width'      => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.height'     => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.price'      => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.is_active'  => ['sometimes', 'boolean'],
            'variants.*.images'     => ['sometimes', 'array', 'max:10'],
            'variants.*.images.*'   => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],

            // ── Option Groups ─────────────────────────────────
            'option_groups'                            => ['sometimes', 'array'],
            'option_groups.*.name'                     => ['required_with:option_groups', 'string', 'max:255'],
            'option_groups.*.is_required'              => ['sometimes', 'boolean'],
            'option_groups.*.sort_order'               => ['sometimes', 'integer', 'min:0'],
            'option_groups.*.options'                  => ['sometimes', 'array'],
            'option_groups.*.options.*.name'           => ['required_with:option_groups.*.options', 'string', 'max:255'],
            'option_groups.*.options.*.price_modifier' => ['required_with:option_groups.*.options', 'numeric'],
            'option_groups.*.options.*.sort_order'     => ['sometimes', 'integer', 'min:0'],
            'option_groups.*.options.*.is_active'      => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'Product name is required.',
            'description.required'    => 'Product description is required.',
            'unit.required'           => 'Unit is required.',
            'unit.in'                 => 'Unit must be one of: sqm, meter, piece, set.',
            'price_per_unit.required' => 'Price per unit is required.',
            'price_per_unit.min'      => 'Price cannot be negative.',
            'category_ids.*.exists'   => 'One or more selected categories do not exist.',
            'images.*.image'          => 'Each file must be a valid image.',
            'images.*.mimes'          => 'Images must be jpg, jpeg, png, or webp.',
            'images.*.max'            => 'Each image must not exceed 5MB.',
            'model_3d.extensions'     => 'The 3D model must use a .glb or .gltf extension.',
            'model_3d.mimes'          => 'The 3D model must be a GLB or GLTF file.',
            'model_3d.max'            => 'The 3D model must not exceed 50MB.',
        ];
    }
}
