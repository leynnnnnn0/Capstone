<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class WorkJobRating extends Model implements AuditableContract
{
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'work_job_id',
        'user_id',
        'rating',
        'comment',
        'submitted_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'submitted_at' => 'datetime',
    ];

    public function workJob()
    {
        return $this->belongsTo(WorkJob::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
