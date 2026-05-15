<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class WorkJobRemark extends Model implements AuditableContract
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'work_job_id',
        'user_id',
        'action',
        'message',
    ];

    public function work_job()
    {
        return $this->belongsTo(WorkJob::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
