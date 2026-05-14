<?php

namespace App\Http\Requests\Customer;

use App\Http\Requests\StoreAppointmentRequest;

class StoreCustomerAppointmentRequest extends StoreAppointmentRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }
}
