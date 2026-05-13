import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:70
* @route '/appointments/{appointment}/work-job'
*/
export const create = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/appointments/{appointment}/work-job',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:70
* @route '/appointments/{appointment}/work-job'
*/
create.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return create.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:70
* @route '/appointments/{appointment}/work-job'
*/
create.get = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:70
* @route '/appointments/{appointment}/work-job'
*/
create.head = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:70
* @route '/appointments/{appointment}/work-job'
*/
const createForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:70
* @route '/appointments/{appointment}/work-job'
*/
createForm.get = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:70
* @route '/appointments/{appointment}/work-job'
*/
createForm.head = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

const workJob = {
    create: Object.assign(create, create),
}

export default workJob