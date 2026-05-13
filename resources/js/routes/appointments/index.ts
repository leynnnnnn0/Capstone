import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import workJob from './work-job'
/**
* @see \App\Http\Controllers\AppointmentController::store
* @see app/Http/Controllers/AppointmentController.php:243
* @route '/appointments'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/appointments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AppointmentController::store
* @see app/Http/Controllers/AppointmentController.php:243
* @route '/appointments'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::store
* @see app/Http/Controllers/AppointmentController.php:243
* @route '/appointments'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::store
* @see app/Http/Controllers/AppointmentController.php:243
* @route '/appointments'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::store
* @see app/Http/Controllers/AppointmentController.php:243
* @route '/appointments'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\AppointmentController::index
* @see app/Http/Controllers/AppointmentController.php:18
* @route '/appointments'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/appointments',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppointmentController::index
* @see app/Http/Controllers/AppointmentController.php:18
* @route '/appointments'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::index
* @see app/Http/Controllers/AppointmentController.php:18
* @route '/appointments'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::index
* @see app/Http/Controllers/AppointmentController.php:18
* @route '/appointments'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppointmentController::index
* @see app/Http/Controllers/AppointmentController.php:18
* @route '/appointments'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::index
* @see app/Http/Controllers/AppointmentController.php:18
* @route '/appointments'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::index
* @see app/Http/Controllers/AppointmentController.php:18
* @route '/appointments'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\AppointmentController::show
* @see app/Http/Controllers/AppointmentController.php:75
* @route '/appointments/{appointment}'
*/
export const show = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/appointments/{appointment}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppointmentController::show
* @see app/Http/Controllers/AppointmentController.php:75
* @route '/appointments/{appointment}'
*/
show.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { appointment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { appointment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            appointment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        appointment: typeof args.appointment === 'object'
        ? args.appointment.id
        : args.appointment,
    }

    return show.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::show
* @see app/Http/Controllers/AppointmentController.php:75
* @route '/appointments/{appointment}'
*/
show.get = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::show
* @see app/Http/Controllers/AppointmentController.php:75
* @route '/appointments/{appointment}'
*/
show.head = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppointmentController::show
* @see app/Http/Controllers/AppointmentController.php:75
* @route '/appointments/{appointment}'
*/
const showForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::show
* @see app/Http/Controllers/AppointmentController.php:75
* @route '/appointments/{appointment}'
*/
showForm.get = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::show
* @see app/Http/Controllers/AppointmentController.php:75
* @route '/appointments/{appointment}'
*/
showForm.head = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\AppointmentController::confirm
* @see app/Http/Controllers/AppointmentController.php:283
* @route '/appointments/{appointment}/confirm'
*/
export const confirm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: confirm.url(args, options),
    method: 'put',
})

confirm.definition = {
    methods: ["put"],
    url: '/appointments/{appointment}/confirm',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AppointmentController::confirm
* @see app/Http/Controllers/AppointmentController.php:283
* @route '/appointments/{appointment}/confirm'
*/
confirm.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { appointment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { appointment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            appointment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        appointment: typeof args.appointment === 'object'
        ? args.appointment.id
        : args.appointment,
    }

    return confirm.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::confirm
* @see app/Http/Controllers/AppointmentController.php:283
* @route '/appointments/{appointment}/confirm'
*/
confirm.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: confirm.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AppointmentController::confirm
* @see app/Http/Controllers/AppointmentController.php:283
* @route '/appointments/{appointment}/confirm'
*/
const confirmForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirm.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::confirm
* @see app/Http/Controllers/AppointmentController.php:283
* @route '/appointments/{appointment}/confirm'
*/
confirmForm.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirm.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

confirm.form = confirmForm

/**
* @see \App\Http\Controllers\AppointmentController::cancel
* @see app/Http/Controllers/AppointmentController.php:370
* @route '/appointments/{appointment}/cancel'
*/
export const cancel = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cancel.url(args, options),
    method: 'put',
})

cancel.definition = {
    methods: ["put"],
    url: '/appointments/{appointment}/cancel',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AppointmentController::cancel
* @see app/Http/Controllers/AppointmentController.php:370
* @route '/appointments/{appointment}/cancel'
*/
cancel.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { appointment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { appointment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            appointment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        appointment: typeof args.appointment === 'object'
        ? args.appointment.id
        : args.appointment,
    }

    return cancel.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::cancel
* @see app/Http/Controllers/AppointmentController.php:370
* @route '/appointments/{appointment}/cancel'
*/
cancel.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cancel.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AppointmentController::cancel
* @see app/Http/Controllers/AppointmentController.php:370
* @route '/appointments/{appointment}/cancel'
*/
const cancelForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::cancel
* @see app/Http/Controllers/AppointmentController.php:370
* @route '/appointments/{appointment}/cancel'
*/
cancelForm.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

cancel.form = cancelForm

/**
* @see \App\Http\Controllers\AppointmentController::reopen
* @see app/Http/Controllers/AppointmentController.php:389
* @route '/appointments/{appointment}/reopen'
*/
export const reopen = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: reopen.url(args, options),
    method: 'put',
})

reopen.definition = {
    methods: ["put"],
    url: '/appointments/{appointment}/reopen',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AppointmentController::reopen
* @see app/Http/Controllers/AppointmentController.php:389
* @route '/appointments/{appointment}/reopen'
*/
reopen.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { appointment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { appointment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            appointment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        appointment: typeof args.appointment === 'object'
        ? args.appointment.id
        : args.appointment,
    }

    return reopen.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::reopen
* @see app/Http/Controllers/AppointmentController.php:389
* @route '/appointments/{appointment}/reopen'
*/
reopen.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: reopen.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AppointmentController::reopen
* @see app/Http/Controllers/AppointmentController.php:389
* @route '/appointments/{appointment}/reopen'
*/
const reopenForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reopen.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::reopen
* @see app/Http/Controllers/AppointmentController.php:389
* @route '/appointments/{appointment}/reopen'
*/
reopenForm.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reopen.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

reopen.form = reopenForm

/**
* @see \App\Http\Controllers\AppointmentController::complete
* @see app/Http/Controllers/AppointmentController.php:351
* @route '/appointments/{appointment}/complete'
*/
export const complete = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: complete.url(args, options),
    method: 'put',
})

complete.definition = {
    methods: ["put"],
    url: '/appointments/{appointment}/complete',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AppointmentController::complete
* @see app/Http/Controllers/AppointmentController.php:351
* @route '/appointments/{appointment}/complete'
*/
complete.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { appointment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { appointment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            appointment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        appointment: typeof args.appointment === 'object'
        ? args.appointment.id
        : args.appointment,
    }

    return complete.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::complete
* @see app/Http/Controllers/AppointmentController.php:351
* @route '/appointments/{appointment}/complete'
*/
complete.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: complete.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AppointmentController::complete
* @see app/Http/Controllers/AppointmentController.php:351
* @route '/appointments/{appointment}/complete'
*/
const completeForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: complete.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::complete
* @see app/Http/Controllers/AppointmentController.php:351
* @route '/appointments/{appointment}/complete'
*/
completeForm.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: complete.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

complete.form = completeForm

/**
* @see \App\Http\Controllers\AppointmentController::onTheWay
* @see app/Http/Controllers/AppointmentController.php:406
* @route '/appointments/{appointment}/on-the-way'
*/
export const onTheWay = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: onTheWay.url(args, options),
    method: 'put',
})

onTheWay.definition = {
    methods: ["put"],
    url: '/appointments/{appointment}/on-the-way',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AppointmentController::onTheWay
* @see app/Http/Controllers/AppointmentController.php:406
* @route '/appointments/{appointment}/on-the-way'
*/
onTheWay.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { appointment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { appointment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            appointment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        appointment: typeof args.appointment === 'object'
        ? args.appointment.id
        : args.appointment,
    }

    return onTheWay.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::onTheWay
* @see app/Http/Controllers/AppointmentController.php:406
* @route '/appointments/{appointment}/on-the-way'
*/
onTheWay.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: onTheWay.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AppointmentController::onTheWay
* @see app/Http/Controllers/AppointmentController.php:406
* @route '/appointments/{appointment}/on-the-way'
*/
const onTheWayForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: onTheWay.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::onTheWay
* @see app/Http/Controllers/AppointmentController.php:406
* @route '/appointments/{appointment}/on-the-way'
*/
onTheWayForm.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: onTheWay.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

onTheWay.form = onTheWayForm

/**
* @see \App\Http\Controllers\AppointmentController::onGoing
* @see app/Http/Controllers/AppointmentController.php:423
* @route '/appointments/{appointment}/on-going'
*/
export const onGoing = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: onGoing.url(args, options),
    method: 'put',
})

onGoing.definition = {
    methods: ["put"],
    url: '/appointments/{appointment}/on-going',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AppointmentController::onGoing
* @see app/Http/Controllers/AppointmentController.php:423
* @route '/appointments/{appointment}/on-going'
*/
onGoing.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { appointment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { appointment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            appointment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        appointment: typeof args.appointment === 'object'
        ? args.appointment.id
        : args.appointment,
    }

    return onGoing.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::onGoing
* @see app/Http/Controllers/AppointmentController.php:423
* @route '/appointments/{appointment}/on-going'
*/
onGoing.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: onGoing.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AppointmentController::onGoing
* @see app/Http/Controllers/AppointmentController.php:423
* @route '/appointments/{appointment}/on-going'
*/
const onGoingForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: onGoing.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppointmentController::onGoing
* @see app/Http/Controllers/AppointmentController.php:423
* @route '/appointments/{appointment}/on-going'
*/
onGoingForm.put = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: onGoing.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

onGoing.form = onGoingForm

const appointments = {
    store: Object.assign(store, store),
    index: Object.assign(index, index),
    show: Object.assign(show, show),
    confirm: Object.assign(confirm, confirm),
    cancel: Object.assign(cancel, cancel),
    reopen: Object.assign(reopen, reopen),
    complete: Object.assign(complete, complete),
    onTheWay: Object.assign(onTheWay, onTheWay),
    onGoing: Object.assign(onGoing, onGoing),
    workJob: Object.assign(workJob, workJob),
}

export default appointments