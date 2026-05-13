import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\QuotationItemImageController::index
* @see app/Http/Controllers/QuotationItemImageController.php:74
* @route '/quotation-items/{quotationItem}/images'
*/
export const index = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/quotation-items/{quotationItem}/images',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationItemImageController::index
* @see app/Http/Controllers/QuotationItemImageController.php:74
* @route '/quotation-items/{quotationItem}/images'
*/
index.url = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotationItem: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { quotationItem: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            quotationItem: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        quotationItem: typeof args.quotationItem === 'object'
        ? args.quotationItem.id
        : args.quotationItem,
    }

    return index.definition.url
            .replace('{quotationItem}', parsedArgs.quotationItem.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationItemImageController::index
* @see app/Http/Controllers/QuotationItemImageController.php:74
* @route '/quotation-items/{quotationItem}/images'
*/
index.get = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::index
* @see app/Http/Controllers/QuotationItemImageController.php:74
* @route '/quotation-items/{quotationItem}/images'
*/
index.head = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::index
* @see app/Http/Controllers/QuotationItemImageController.php:74
* @route '/quotation-items/{quotationItem}/images'
*/
const indexForm = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::index
* @see app/Http/Controllers/QuotationItemImageController.php:74
* @route '/quotation-items/{quotationItem}/images'
*/
indexForm.get = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::index
* @see app/Http/Controllers/QuotationItemImageController.php:74
* @route '/quotation-items/{quotationItem}/images'
*/
indexForm.head = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\QuotationItemImageController::store
* @see app/Http/Controllers/QuotationItemImageController.php:19
* @route '/quotation-items/{quotationItem}/images'
*/
export const store = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/quotation-items/{quotationItem}/images',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuotationItemImageController::store
* @see app/Http/Controllers/QuotationItemImageController.php:19
* @route '/quotation-items/{quotationItem}/images'
*/
store.url = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotationItem: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { quotationItem: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            quotationItem: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        quotationItem: typeof args.quotationItem === 'object'
        ? args.quotationItem.id
        : args.quotationItem,
    }

    return store.definition.url
            .replace('{quotationItem}', parsedArgs.quotationItem.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationItemImageController::store
* @see app/Http/Controllers/QuotationItemImageController.php:19
* @route '/quotation-items/{quotationItem}/images'
*/
store.post = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::store
* @see app/Http/Controllers/QuotationItemImageController.php:19
* @route '/quotation-items/{quotationItem}/images'
*/
const storeForm = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::store
* @see app/Http/Controllers/QuotationItemImageController.php:19
* @route '/quotation-items/{quotationItem}/images'
*/
storeForm.post = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(args, options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\QuotationItemImageController::update
* @see app/Http/Controllers/QuotationItemImageController.php:116
* @route '/quotation-item-images/{image}'
*/
export const update = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/quotation-item-images/{image}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\QuotationItemImageController::update
* @see app/Http/Controllers/QuotationItemImageController.php:116
* @route '/quotation-item-images/{image}'
*/
update.url = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { image: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { image: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            image: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        image: typeof args.image === 'object'
        ? args.image.id
        : args.image,
    }

    return update.definition.url
            .replace('{image}', parsedArgs.image.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationItemImageController::update
* @see app/Http/Controllers/QuotationItemImageController.php:116
* @route '/quotation-item-images/{image}'
*/
update.patch = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::update
* @see app/Http/Controllers/QuotationItemImageController.php:116
* @route '/quotation-item-images/{image}'
*/
const updateForm = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::update
* @see app/Http/Controllers/QuotationItemImageController.php:116
* @route '/quotation-item-images/{image}'
*/
updateForm.patch = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\QuotationItemImageController::destroy
* @see app/Http/Controllers/QuotationItemImageController.php:99
* @route '/quotation-item-images/{image}'
*/
export const destroy = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/quotation-item-images/{image}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\QuotationItemImageController::destroy
* @see app/Http/Controllers/QuotationItemImageController.php:99
* @route '/quotation-item-images/{image}'
*/
destroy.url = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { image: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { image: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            image: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        image: typeof args.image === 'object'
        ? args.image.id
        : args.image,
    }

    return destroy.definition.url
            .replace('{image}', parsedArgs.image.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationItemImageController::destroy
* @see app/Http/Controllers/QuotationItemImageController.php:99
* @route '/quotation-item-images/{image}'
*/
destroy.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::destroy
* @see app/Http/Controllers/QuotationItemImageController.php:99
* @route '/quotation-item-images/{image}'
*/
const destroyForm = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationItemImageController::destroy
* @see app/Http/Controllers/QuotationItemImageController.php:99
* @route '/quotation-item-images/{image}'
*/
destroyForm.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const QuotationItemImageController = { index, store, update, destroy }

export default QuotationItemImageController