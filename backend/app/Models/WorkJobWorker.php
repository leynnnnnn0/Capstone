<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkJobWorker extends Model
{
    /** @use HasFactory<\Database\Factories\WorkJobWorkerFactory> */
    use HasFactory;

    protected $fillable = [
        'work_job_id',
        'user_id'
    ];
}
