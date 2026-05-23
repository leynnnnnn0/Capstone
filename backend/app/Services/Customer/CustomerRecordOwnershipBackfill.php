<?php

namespace App\Services\Customer;

use App\Models\Appointment;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Validation\ValidationException;
use Throwable;

class CustomerRecordOwnershipBackfill
{
    public function __construct(
        private readonly CustomerAccountResolver $customerAccountResolver
    ) {}

    /**
     * @return array{
     *     appointments_linked:int,
     *     work_jobs_linked:int,
     *     work_jobs_inherited_from_appointment:int,
     *     work_jobs_inherited_from_parent:int,
     *     customers_created:int,
     *     skipped:array<int, array{type:string,id:int,reason:string}>
     * }
     */
    public function run(): array
    {
        $usersBefore = User::query()->count();

        $summary = [
            'appointments_linked' => 0,
            'work_jobs_linked' => 0,
            'work_jobs_inherited_from_appointment' => 0,
            'work_jobs_inherited_from_parent' => 0,
            'customers_created' => 0,
            'skipped' => [],
        ];

        Appointment::query()
            ->whereNull('user_id')
            ->orderBy('id')
            ->chunkById(100, function ($appointments) use (&$summary): void {
                foreach ($appointments as $appointment) {
                    $user = $this->resolveAppointmentOwner($appointment, $summary);

                    if (! $user) {
                        continue;
                    }

                    $appointment->updateQuietly(['user_id' => $user->id]);
                    $summary['appointments_linked']++;
                }
            });

        WorkJob::query()
            ->whereNull('user_id')
            ->with(['appointment', 'parentWorkJob.appointment'])
            ->orderBy('id')
            ->chunkById(100, function ($workJobs) use (&$summary): void {
                foreach ($workJobs as $workJob) {
                    $result = $this->resolveWorkJobOwner($workJob, $summary);

                    if (! $result['user']) {
                        continue;
                    }

                    $workJob->updateQuietly(['user_id' => $result['user']->id]);
                    $summary['work_jobs_linked']++;

                    if ($result['source'] === 'appointment') {
                        $summary['work_jobs_inherited_from_appointment']++;
                    }

                    if ($result['source'] === 'parent') {
                        $summary['work_jobs_inherited_from_parent']++;
                    }
                }
            });

        $summary['customers_created'] = max(0, User::query()->count() - $usersBefore);

        return $summary;
    }

    private function resolveAppointmentOwner(Appointment $appointment, array &$summary): ?User
    {
        try {
            return $this->customerAccountResolver->resolveForBooking([
                'first_name' => $appointment->first_name,
                'last_name' => $appointment->last_name,
                'email' => $appointment->email,
                'phone_number' => $appointment->phone_number,
            ]);
        } catch (ValidationException $exception) {
            $this->skip($summary, 'appointment', $appointment->id, $this->validationMessage($exception));
        } catch (Throwable $exception) {
            $this->skip($summary, 'appointment', $appointment->id, $exception->getMessage());
        }

        return null;
    }

    /**
     * @return array{user:?User, source:string}
     */
    private function resolveWorkJobOwner(WorkJob $workJob, array &$summary): array
    {
        if ($workJob->appointment?->user_id) {
            return [
                'user' => $workJob->appointment->customer()->first(),
                'source' => 'appointment',
            ];
        }

        if ($workJob->parentWorkJob?->user_id) {
            return [
                'user' => $workJob->parentWorkJob->customer()->first(),
                'source' => 'parent',
            ];
        }

        if ($workJob->parentWorkJob?->appointment?->user_id) {
            return [
                'user' => $workJob->parentWorkJob->appointment->customer()->first(),
                'source' => 'parent',
            ];
        }

        try {
            return [
                'user' => $this->customerAccountResolver->resolveForBooking([
                    'first_name' => $workJob->first_name,
                    'last_name' => $workJob->last_name,
                    'email' => $workJob->email,
                    'phone_number' => $workJob->phone_number,
                ]),
                'source' => 'contact',
            ];
        } catch (ValidationException $exception) {
            $this->skip($summary, 'work_job', $workJob->id, $this->validationMessage($exception));
        } catch (Throwable $exception) {
            $this->skip($summary, 'work_job', $workJob->id, $exception->getMessage());
        }

        return [
            'user' => null,
            'source' => 'skipped',
        ];
    }

    private function skip(array &$summary, string $type, int $id, string $reason): void
    {
        $summary['skipped'][] = [
            'type' => $type,
            'id' => $id,
            'reason' => $reason,
        ];
    }

    private function validationMessage(ValidationException $exception): string
    {
        $messages = collect($exception->errors())
            ->flatten()
            ->filter()
            ->values();

        return $messages->first() ?: $exception->getMessage();
    }
}
