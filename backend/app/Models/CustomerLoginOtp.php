<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerLoginOtp extends Model
{
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
