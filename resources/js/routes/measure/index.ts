import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see routes/web.php:49
* @route '/measure'
*/
export const input = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: input.url(options),
    method: 'get',
})

input.definition = {
    methods: ["get","head"],
    url: '/measure',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:49
* @route '/measure'
*/
input.url = (options?: RouteQueryOptions) => {
    return input.definition.url + queryParams(options)
}

/**
* @see routes/web.php:49
* @route '/measure'
*/
input.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: input.url(options),
    method: 'get',
})

/**
* @see routes/web.php:49
* @route '/measure'
*/
input.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: input.url(options),
    method: 'head',
})

/**
* @see routes/web.php:49
* @route '/measure'
*/
const inputForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: input.url(options),
    method: 'get',
})

/**
* @see routes/web.php:49
* @route '/measure'
*/
inputForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: input.url(options),
    method: 'get',
})

/**
* @see routes/web.php:49
* @route '/measure'
*/
inputForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: input.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

input.form = inputForm

const measure = {
    input: Object.assign(input, input),
}

export default measure