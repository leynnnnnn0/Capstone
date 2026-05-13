import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see routes/web.php:54
* @route '/ar-place'
*/
export const place = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: place.url(options),
    method: 'get',
})

place.definition = {
    methods: ["get","head"],
    url: '/ar-place',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:54
* @route '/ar-place'
*/
place.url = (options?: RouteQueryOptions) => {
    return place.definition.url + queryParams(options)
}

/**
* @see routes/web.php:54
* @route '/ar-place'
*/
place.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: place.url(options),
    method: 'get',
})

/**
* @see routes/web.php:54
* @route '/ar-place'
*/
place.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: place.url(options),
    method: 'head',
})

/**
* @see routes/web.php:54
* @route '/ar-place'
*/
const placeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: place.url(options),
    method: 'get',
})

/**
* @see routes/web.php:54
* @route '/ar-place'
*/
placeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: place.url(options),
    method: 'get',
})

/**
* @see routes/web.php:54
* @route '/ar-place'
*/
placeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: place.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

place.form = placeForm

const ar = {
    place: Object.assign(place, place),
}

export default ar