import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
export const store = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/products/{product}/option-groups/{group}/options',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
store.url = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace('{group}', parsedArgs.group.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
store.post = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
const storeForm = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
storeForm.post = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
export const destroy = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/products/{product}/option-groups/{group}/options/{option}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
destroy.url = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            product: args[0],
            group: args[1],
            option: args[2],
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
        option: typeof args.option === 'object'
        ? args.option.id
        : args.option,
    }

    return destroy.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace('{group}', parsedArgs.group.toString())
            .replace('{option}', parsedArgs.option.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
destroy.delete = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
const destroyForm = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
destroyForm.delete = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const options = {
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
}

export default options