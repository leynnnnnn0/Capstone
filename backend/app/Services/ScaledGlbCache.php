<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use JsonException;
use RuntimeException;
use Throwable;

class ScaledGlbCache
{
    private const GLB_MAGIC = 'glTF';

    private const GLB_VERSION = 2;

    private const JSON_CHUNK_TYPE = 0x4E4F534A;

    /**
     * @param  array{x: float, y: float, z: float}  $scale
     */
    public function forFile(string $sourcePath, array $scale): ?string
    {
        if (collect($scale)->contains(fn (mixed $value) => ! is_numeric($value) || $value <= 0 || $value > 10)) {
            return null;
        }

        try {
            $cacheDirectory = storage_path('framework/cache/ar-models');
            File::ensureDirectoryExists($cacheDirectory);

            $signature = hash('sha256', implode('|', [
                realpath($sourcePath) ?: $sourcePath,
                (string) filesize($sourcePath),
                (string) filemtime($sourcePath),
                sprintf('%.8F', $scale['x']),
                sprintf('%.8F', $scale['y']),
                sprintf('%.8F', $scale['z']),
            ]));
            $cachedPath = "{$cacheDirectory}/{$signature}.glb";

            if (is_file($cachedPath)) {
                return $cachedPath;
            }

            $contents = file_get_contents($sourcePath);

            if ($contents === false) {
                return null;
            }

            $scaled = $this->wrapDefaultSceneWithScale($contents, $scale);
            $temporaryPath = tempnam($cacheDirectory, 'scaled-glb-');

            if ($temporaryPath === false) {
                return null;
            }

            try {
                if (file_put_contents($temporaryPath, $scaled, LOCK_EX) === false) {
                    return null;
                }

                if (! @rename($temporaryPath, $cachedPath) && ! is_file($cachedPath)) {
                    return null;
                }
            } finally {
                if (is_file($temporaryPath)) {
                    @unlink($temporaryPath);
                }
            }

            return $cachedPath;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Add a root node around the active GLB scene so native AR viewers receive
     * the intended meter conversion as part of the model file itself.
     *
     * @param  array{x: float, y: float, z: float}  $scale
     */
    private function wrapDefaultSceneWithScale(string $glb, array $scale): string
    {
        if (strlen($glb) < 20 || substr($glb, 0, 4) !== self::GLB_MAGIC) {
            throw new RuntimeException('Invalid GLB header.');
        }

        $header = unpack('Vversion/Vlength', substr($glb, 4, 8));

        if (($header['version'] ?? null) !== self::GLB_VERSION ||
            ($header['length'] ?? null) !== strlen($glb)) {
            throw new RuntimeException('Unsupported or truncated GLB.');
        }

        $chunks = [];
        $offset = 12;

        while ($offset + 8 <= strlen($glb)) {
            $chunkHeader = unpack('Vlength/Vtype', substr($glb, $offset, 8));
            $chunkLength = $chunkHeader['length'] ?? -1;
            $chunkEnd = $offset + 8 + $chunkLength;

            if ($chunkLength < 0 || $chunkEnd > strlen($glb)) {
                throw new RuntimeException('Invalid GLB chunk.');
            }

            $chunks[] = [
                'type' => $chunkHeader['type'],
                'data' => substr($glb, $offset + 8, $chunkLength),
            ];
            $offset = $chunkEnd;
        }

        if ($offset !== strlen($glb) ||
            ($chunks[0]['type'] ?? null) !== self::JSON_CHUNK_TYPE) {
            throw new RuntimeException('GLB JSON chunk is missing.');
        }

        try {
            $document = json_decode(
                rtrim($chunks[0]['data'], " \t\n\r\0\x0B"),
                true,
                flags: JSON_THROW_ON_ERROR,
            );
        } catch (JsonException $exception) {
            throw new RuntimeException('Invalid GLB JSON.', previous: $exception);
        }

        $sceneIndex = $document['scene'] ?? 0;

        if (! isset($document['scenes'][$sceneIndex]) ||
            ! is_array($document['scenes'][$sceneIndex])) {
            throw new RuntimeException('GLB default scene is missing.');
        }

        $rootNodes = $document['scenes'][$sceneIndex]['nodes'] ?? [];
        $document['nodes'] ??= [];
        $document['nodes'][] = [
            'name' => 'SOG_AR_METER_SCALE',
            'scale' => [$scale['x'], $scale['y'], $scale['z']],
            'children' => array_values($rootNodes),
        ];
        $document['scenes'][$sceneIndex]['nodes'] = [count($document['nodes']) - 1];

        $json = json_encode(
            $document,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        );
        $chunks[0]['data'] = str_pad($json, (strlen($json) + 3) & ~3, ' ');

        $body = '';

        foreach ($chunks as $chunk) {
            $body .= pack('V', strlen($chunk['data']));
            $body .= pack('V', $chunk['type']);
            $body .= $chunk['data'];
        }

        return self::GLB_MAGIC.pack('V', self::GLB_VERSION).pack('V', 12 + strlen($body)).$body;
    }
}
