<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Product3DModel;
use App\Services\ScaledGlbCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class Product3DModelFileController extends Controller
{
    public function __invoke(
        Request $request,
        Product3DModel $product3DModel,
        ScaledGlbCache $scaledGlbCache,
    ): Response {
        $disk = Storage::disk('public');

        abort_unless($disk->exists($product3DModel->file_path), 404);

        $origin = $request->headers->get('Origin');
        $extension = strtolower(pathinfo($product3DModel->file_path, PATHINFO_EXTENSION));
        $filePath = $disk->path($product3DModel->file_path);
        $requestedScale = $this->requestedScale($request);

        if ($extension === 'glb' &&
            $requestedScale !== null &&
            collect($requestedScale)->every(
                fn (float $scale) => $scale >= 0.000001 && $scale <= 10
            )) {
            $filePath = $scaledGlbCache->forFile($filePath, $requestedScale) ?? $filePath;
        }

        $contentType = match ($extension) {
            'glb' => 'model/gltf-binary',
            'gltf' => 'model/gltf+json',
            default => $product3DModel->mime_type ?: 'application/octet-stream',
        };

        return response()->file($filePath, [
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

    /**
     * @return array{x: float, y: float, z: float}|null
     */
    private function requestedScale(Request $request): ?array
    {
        $axisValues = collect(['x', 'y', 'z'])
            ->mapWithKeys(function (string $axis) use ($request): array {
                $value = filter_var(
                    $request->query("ar_scale_{$axis}"),
                    FILTER_VALIDATE_FLOAT,
                    FILTER_NULL_ON_FAILURE,
                );

                return [$axis => is_float($value) ? $value : null];
            });

        if ($axisValues->every(fn (?float $value) => $value !== null)) {
            return $axisValues->all();
        }

        $uniform = filter_var(
            $request->query('ar_scale'),
            FILTER_VALIDATE_FLOAT,
            FILTER_NULL_ON_FAILURE,
        );

        return is_float($uniform)
            ? ['x' => $uniform, 'y' => $uniform, 'z' => $uniform]
            : null;
    }
}
