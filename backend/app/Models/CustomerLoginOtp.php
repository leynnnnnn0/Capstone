<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class CustomerLoginOtp extends Model implements AuditableContract
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'contact',
        'contact_type',
        'code_hash',
        'attempts',
        'expires_at',
        'consumed_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];

    public function isUsable(): bool
    {
        return $this->consumed_at === null && $this->expires_at->isFuture();
    }
}
