import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TrackingController::index
* @see app/Http/Controllers/TrackingController.php:16
* @route '/track'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/track',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TrackingController::index
* @see app/Http/Controllers/TrackingController.php:16
* @route '/track'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrackingController::index
* @see app/Http/Controllers/TrackingController.php:16
* @route '/track'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TrackingController::index
* @see app/Http/Controllers/TrackingController.php:16
* @route '/track'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TrackingController::index
* @see app/Http/Controllers/TrackingController.php:16
* @route '/track'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TrackingController::index
* @see app/Http/Controllers/TrackingController.php:16
* @route '/track'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TrackingController::index
* @see app/Http/Controllers/TrackingController.php:16
* @route '/track'
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
* @see \App\Http\Controllers\TrackingController::track
* @see app/Http/Controllers/TrackingController.php:27
* @route '/track'
*/
export const track = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: track.url(options),
    method: 'post',
})

track.definition = {
    methods: ["post"],
    url: '/track',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TrackingController::track
* @see app/Http/Controllers/TrackingController.php:27
* @route '/track'
*/
track.url = (options?: RouteQueryOptions) => {
    return track.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TrackingController::track
* @see app/Http/Controllers/TrackingController.php:27
* @route '/track'
*/
track.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: track.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TrackingController::track
* @see app/Http/Controllers/TrackingController.php:27
* @route '/track'
*/
const trackForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: track.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TrackingController::track
* @see app/Http/Controllers/TrackingController.php:27
* @route '/track'
*/
trackForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: track.url(options),
    method: 'post',
})

track.form = trackForm

const TrackingController = { index, track }

export default TrackingController