import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AppointmentController::create
* @see app/Http/Controllers/AppointmentController.php:464
* @route '/appointments/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/appointments/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppointmentController::create
* @see app/Http/Controllers/AppointmentController.php:464
* @route '/appointments/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::create
* @see app/Http/Controllers/AppointmentController.php:464
* @route '/appointments/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::create
* @see app/Http/Controllers/AppointmentController.php:464
* @route '/appointments/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppointmentController::create
* @see app/Http/Controllers/AppointmentController.php:464
* @route '/appointments/create'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::create
* @see app/Http/Controllers/AppointmentController.php:464
* @route '/appointments/create'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::create
* @see app/Http/Controllers/AppointmentController.php:464
* @route '/appointments/create'
*/
createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

/**
* @see \App\Http\Controllers\AppointmentController::getAvailableWorkers
* @see app/Http/Controllers/AppointmentController.php:440
* @route '/get-available-workers'
*/
export const getAvailableWorkers = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAvailableWorkers.url(options),
    method: 'get',
})

getAvailableWorkers.definition = {
    methods: ["get","head"],
    url: '/get-available-workers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppointmentController::getAvailableWorkers
* @see app/Http/Controllers/AppointmentController.php:440
* @route '/get-available-workers'
*/
getAvailableWorkers.url = (options?: RouteQueryOptions) => {
    return getAvailableWorkers.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppointmentController::getAvailableWorkers
* @see app/Http/Controllers/AppointmentController.php:440
* @route '/get-available-workers'
*/
getAvailableWorkers.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAvailableWorkers.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::getAvailableWorkers
* @see app/Http/Controllers/AppointmentController.php:440
* @route '/get-available-workers'
*/
getAvailableWorkers.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAvailableWorkers.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppointmentController::getAvailableWorkers
* @see app/Http/Controllers/AppointmentController.php:440
* @route '/get-available-workers'
*/
const getAvailableWorkersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAvailableWorkers.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::getAvailableWorkers
* @see app/Http/Controllers/AppointmentController.php:440
* @route '/get-available-workers'
*/
getAvailableWorkersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAvailableWorkers.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppointmentController::getAvailableWorkers
* @see app/Http/Controllers/AppointmentController.php:440
* @route '/get-available-workers'
*/
getAvailableWorkersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAvailableWorkers.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAvailableWorkers.form = getAvailableWorkersForm

const appointment = {
    create: Object.assign(create, create),
    getAvailableWorkers: Object.assign(getAvailableWorkers, getAvailableWorkers),
}

export default appointment