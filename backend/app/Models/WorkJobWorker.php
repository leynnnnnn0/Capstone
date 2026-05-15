<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class WorkJobWorker extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\WorkJobWorkerFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'work_job_id',
        'user_id'
    ];
}
