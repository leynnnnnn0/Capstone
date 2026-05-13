import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\GetQuoteController::store
* @see app/Http/Controllers/GetQuoteController.php:121
* @route '/get-quote'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/get-quote',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GetQuoteController::store
* @see app/Http/Controllers/GetQuoteController.php:121
* @route '/get-quote'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GetQuoteController::store
* @see app/Http/Controllers/GetQuoteController.php:121
* @route '/get-quote'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\GetQuoteController::store
* @see app/Http/Controllers/GetQuoteController.php:121
* @route '/get-quote'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\GetQuoteController::store
* @see app/Http/Controllers/GetQuoteController.php:121
* @route '/get-quote'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\GetQuoteController::success
* @see app/Http/Controllers/GetQuoteController.php:78
* @route '/get-quote/success/{appointment}'
*/
export const success = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: success.url(args, options),
    method: 'get',
})

success.definition = {
    methods: ["get","head"],
    url: '/get-quote/success/{appointment}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\GetQuoteController::success
* @see app/Http/Controllers/GetQuoteController.php:78
* @route '/get-quote/success/{appointment}'
*/
success.url = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return success.definition.url
            .replace('{appointment}', parsedArgs.appointment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\GetQuoteController::success
* @see app/Http/Controllers/GetQuoteController.php:78
* @route '/get-quote/success/{appointment}'
*/
success.get = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: success.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\GetQuoteController::success
* @see app/Http/Controllers/GetQuoteController.php:78
* @route '/get-quote/success/{appointment}'
*/
success.head = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: success.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\GetQuoteController::success
* @see app/Http/Controllers/GetQuoteController.php:78
* @route '/get-quote/success/{appointment}'
*/
const successForm = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: success.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\GetQuoteController::success
* @see app/Http/Controllers/GetQuoteController.php:78
* @route '/get-quote/success/{appointment}'
*/
successForm.get = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: success.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\GetQuoteController::success
* @see app/Http/Controllers/GetQuoteController.php:78
* @route '/get-quote/success/{appointment}'
*/
successForm.head = (args: { appointment: number | { id: number } } | [appointment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: success.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

success.form = successForm

const getQuote = {
    store: Object.assign(store, store),
    success: Object.assign(success, success),
}

export default getQuote