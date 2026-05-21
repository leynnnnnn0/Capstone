<?php

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

            'images'          => ['sometimes', 'array', 'max:10'],
            'images.*'        => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'deleted_image_ids'   => ['sometimes', 'array'],
            'deleted_image_ids.*' => ['integer', 'exists:product_images,id'],
            'model_3d'           => [
                'sometimes',
                'file',
                'extensions:glb,gltf',
                'mimetypes:model/gltf-binary,model/gltf+json,application/octet-stream,application/json,text/plain',
                'max:51200',
            ],
            'delete_3d_model'    => ['sometimes', 'boolean'],

            'variants'              => ['sometimes', 'array'],
            'variants.*.id'         => ['sometimes', 'integer', 'exists:product_variants,id'],
            'variants.*.width'      => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.height'     => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.price'      => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.is_active'  => ['sometimes', 'boolean'],
            'variants.*.images'     => ['sometimes', 'array', 'max:10'],
            'variants.*.images.*'   => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'variants.*.deleted_image_ids'   => ['sometimes', 'array'],
            'variants.*.deleted_image_ids.*' => ['integer', 'exists:product_variant_images,id'],

            'option_groups'                            => ['sometimes', 'array'],
            'option_groups.*.id'                       => ['sometimes', 'integer', 'exists:product_option_groups,id'],
            'option_groups.*.name'                     => ['required_with:option_groups', 'string', 'max:255'],
            'option_groups.*.is_required'              => ['sometimes', 'boolean'],
            'option_groups.*.sort_order'               => ['sometimes', 'integer', 'min:0'],
            'option_groups.*.options'                  => ['sometimes', 'array'],
            'option_groups.*.options.*.id'             => ['sometimes', 'integer', 'exists:product_options,id'],
            'option_groups.*.options.*.name'           => ['required_with:option_groups.*.options', 'string', 'max:255'],
            'option_groups.*.options.*.price_modifier' => ['required_with:option_groups.*.options', 'numeric'],
            'option_groups.*.options.*.sort_order'     => ['sometimes', 'integer', 'min:0'],
            'option_groups.*.options.*.is_active'      => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'unit.in'        => 'Unit must be one of: sqm, meter, piece, set.',
            'price_per_unit.min' => 'Price cannot be negative.',
            'model_3d.extensions' => 'The 3D model must use a .glb or .gltf extension.',
            'model_3d.mimes' => 'The 3D model must be a GLB or GLTF file.',
            'model_3d.max'   => 'The 3D model must not exceed 50MB.',
        ];
    }
}
