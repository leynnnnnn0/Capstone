<?php

namespace App\Http\Controllers\Customer;

use App\Enums\WorkJobStatus;
use App\Events\WorkJobChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkJobResource;
use App\Models\WorkJob;
use App\Services\Customer\CustomerRecordAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerWorkJobRatingController extends Controller
{
    public function __construct(private readonly CustomerRecordAccess $recordAccess) {}

    public function __invoke(Request $request, WorkJob $workJob): JsonResponse
    {
        abort_unless($this->recordAccess->canAccessWorkJob($request->user(), $workJob), 404);

        if ($workJob->status !== WorkJobStatus::Completed) {
            throw ValidationException::withMessages([
                'rating' => 'You can rate a work job only after it is completed.',
            ]);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $wasAlreadyRated = $workJob->rating()->exists();

        DB::transaction(function () use ($workJob, $request, $data, $wasAlreadyRated): void {
            $workJob->rating()->updateOrCreate(
                ['work_job_id' => $workJob->id],
                [
                    'user_id' => $request->user()->id,
                    'rating' => $data['rating'],
                    'comment' => $data['comment'] ?? null,
                    'submitted_at' => now(),
                ]
            );

            $verb = $wasAlreadyRated ? 'updated' : 'submitted';
            $comment = filled($data['comment'] ?? null) ? " Comment: {$data['comment']}" : '';

            $workJob->remarks()->create([
                'user_id' => $request->user()->id,
                'action' => 'rated',
                'message' => "Customer {$verb} a {$data['rating']}-star satisfaction rating.{$comment}",
            ]);
        });

        $freshWorkJob = $workJob->fresh()->load([
            'workers',
            'appointment.workJob',
            'parentWorkJob.workers',
            'backJobs.workers',
            'quotation.quotation_items.options',
            'quotation.quotation_items.product.product_images',
            'quotation.quotation_items.before_images',
            'quotation.quotation_items.after_images',
            'payments.payer',
            'payments.creator',
            'charges.creator',
            'charges.approver',
            'remarks.user',
            'rating.customer',
        ]);

        WorkJobChanged::dispatch(
            $freshWorkJob,
            'rated',
            "Customer rated {$freshWorkJob->work_job_number} {$data['rating']}/5.",
            $request->user()
        );

        return response()->json([
            'message' => 'Thank you. Your rating has been saved.',
            'data' => new WorkJobResource($freshWorkJob),
        ]);
    }
}
