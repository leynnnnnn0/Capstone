import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
export const store = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/products/{product}/option-groups',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
store.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return store.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
store.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
const storeForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
storeForm.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
export const destroy = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/products/{product}/option-groups/{group}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
destroy.url = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            product: args[0],
            group: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
        group: typeof args.group === 'object'
        ? args.group.id
        : args.group,
    }

    return destroy.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace('{group}', parsedArgs.group.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
destroy.delete = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
const destroyForm = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
destroyForm.delete = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const optionGroups = {
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
}

export default optionGroups