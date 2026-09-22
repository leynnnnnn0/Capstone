<?php

namespace App\Http\Controllers\Database;

use App\Http\Controllers\Controller;
use App\Services\DatabaseBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DatabaseBackupController extends Controller
{
    public function __construct(private readonly DatabaseBackupService $backups) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->backups->all()]);
    }

    public function store(): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Database backup created successfully.',
                'data' => $this->backups->create(),
            ], 201);
        } catch (RuntimeException $exception) {
            Log::error('Database backup failed.', ['exception' => $exception]);

            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function download(string $backup): BinaryFileResponse|JsonResponse
    {
        try {
            return response()->download($this->backups->path($backup), $backup, [
                'Content-Type' => 'application/octet-stream',
            ]);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 404);
        }
    }

    public function restore(Request $request, string $backup): JsonResponse
    {
        $request->validate([
            'confirmation' => ['required', 'in:RESTORE'],
        ]);

        try {
            $safetyBackup = $this->backups->restoreWithSafetyBackup($backup);

            return response()->json([
                'message' => 'Database restored successfully.',
                'safety_backup' => $safetyBackup,
            ]);
        } catch (RuntimeException $exception) {
            Log::critical('Database restore failed.', [
                'backup' => $backup,
                'user_id' => $request->user()?->id,
                'exception' => $exception,
            ]);

            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }
}
