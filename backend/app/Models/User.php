<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements AuditableContract
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'username',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'email_verified_at',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

    protected $appends = [
        'full_name'
    ];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    // ── Relationships ─────────────────────────────────────────────

    public function appointments(): BelongsToMany
    {
        return $this->belongsToMany(Appointment::class, 'appointment_workers');
    }

    // ── Helpers ───────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->role === 'admin';
    }

    public function isWorker(): bool
    {
        return $this->hasRole('worker') || $this->role === 'worker';
    }

    public function isSubAdmin(): bool
    {
        return $this->hasRole('sub_admin') || $this->role === 'sub_admin';
    }

    public function isOperationsAdmin(): bool
    {
        return $this->isAdmin() || $this->isSubAdmin();
    }

    public function isCustomer(): bool
    {
        return $this->hasRole('customer') || $this->role === 'customer';
    }
}
