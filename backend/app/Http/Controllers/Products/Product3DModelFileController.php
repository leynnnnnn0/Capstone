<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Product3DModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class Product3DModelFileController extends Controller
{
    public function __invoke(Request $request, Product3DModel $product3DModel): Response
    {
        $disk = Storage::disk('public');

        abort_unless($disk->exists($product3DModel->file_path), 404);

        $origin = $request->headers->get('Origin');
        $extension = strtolower(pathinfo($product3DModel->file_path, PATHINFO_EXTENSION));
        $contentType = match ($extension) {
            'glb' => 'model/gltf-binary',
            'gltf' => 'model/gltf+json',
            default => $product3DModel->mime_type ?: 'application/octet-stream',
        };

        return response()->file($disk->path($product3DModel->file_path), [
            'Access-Control-Allow-Origin' => $origin ?: '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => 'Origin, Content-Type, Accept, Authorization, X-Requested-With, Range',
            'Access-Control-Expose-Headers' => 'Accept-Ranges, Content-Length, Content-Range, Content-Type',
            'Cross-Origin-Resource-Policy' => 'cross-origin',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'Content-Type' => $contentType,
            'Vary' => 'Origin',
        ]);
    }
}
