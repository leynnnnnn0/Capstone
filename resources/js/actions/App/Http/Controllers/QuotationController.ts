import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\QuotationController::store
* @see app/Http/Controllers/QuotationController.php:59
* @route '/quotations'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/quotations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuotationController::store
* @see app/Http/Controllers/QuotationController.php:59
* @route '/quotations'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::store
* @see app/Http/Controllers/QuotationController.php:59
* @route '/quotations'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationController::store
* @see app/Http/Controllers/QuotationController.php:59
* @route '/quotations'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationController::store
* @see app/Http/Controllers/QuotationController.php:59
* @route '/quotations'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\QuotationController::update
* @see app/Http/Controllers/QuotationController.php:85
* @route '/quotations/{quotation}'
*/
export const update = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/quotations/{quotation}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\QuotationController::update
* @see app/Http/Controllers/QuotationController.php:85
* @route '/quotations/{quotation}'
*/
update.url = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotation: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { quotation: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            quotation: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        quotation: typeof args.quotation === 'object'
        ? args.quotation.id
        : args.quotation,
    }

    return update.definition.url
            .replace('{quotation}', parsedArgs.quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::update
* @see app/Http/Controllers/QuotationController.php:85
* @route '/quotations/{quotation}'
*/
update.put = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\QuotationController::update
* @see app/Http/Controllers/QuotationController.php:85
* @route '/quotations/{quotation}'
*/
const updateForm = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationController::update
* @see app/Http/Controllers/QuotationController.php:85
* @route '/quotations/{quotation}'
*/
updateForm.put = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\QuotationController::updateItemStatus
* @see app/Http/Controllers/QuotationController.php:107
* @route '/quotation-items/{quotationItem}/status'
*/
export const updateItemStatus = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateItemStatus.url(args, options),
    method: 'patch',
})

updateItemStatus.definition = {
    methods: ["patch"],
    url: '/quotation-items/{quotationItem}/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\QuotationController::updateItemStatus
* @see app/Http/Controllers/QuotationController.php:107
* @route '/quotation-items/{quotationItem}/status'
*/
updateItemStatus.url = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return updateItemStatus.definition.url
            .replace('{quotationItem}', parsedArgs.quotationItem.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::updateItemStatus
* @see app/Http/Controllers/QuotationController.php:107
* @route '/quotation-items/{quotationItem}/status'
*/
updateItemStatus.patch = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateItemStatus.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\QuotationController::updateItemStatus
* @see app/Http/Controllers/QuotationController.php:107
* @route '/quotation-items/{quotationItem}/status'
*/
const updateItemStatusForm = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateItemStatus.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuotationController::updateItemStatus
* @see app/Http/Controllers/QuotationController.php:107
* @route '/quotation-items/{quotationItem}/status'
*/
updateItemStatusForm.patch = (args: { quotationItem: number | { id: number } } | [quotationItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateItemStatus.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateItemStatus.form = updateItemStatusForm

/**
* @see \App\Http\Controllers\QuotationController::download
* @see app/Http/Controllers/QuotationController.php:130
* @route '/quotations/{quotation}/download'
*/
export const download = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/quotations/{quotation}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationController::download
* @see app/Http/Controllers/QuotationController.php:130
* @route '/quotations/{quotation}/download'
*/
download.url = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotation: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { quotation: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            quotation: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        quotation: typeof args.quotation === 'object'
        ? args.quotation.id
        : args.quotation,
    }

    return download.definition.url
            .replace('{quotation}', parsedArgs.quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::download
* @see app/Http/Controllers/QuotationController.php:130
* @route '/quotations/{quotation}/download'
*/
download.get = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuotationController::download
* @see app/Http/Controllers/QuotationController.php:130
* @route '/quotations/{quotation}/download'
*/
download.head = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\QuotationController::download
* @see app/Http/Controllers/QuotationController.php:130
* @route '/quotations/{quotation}/download'
*/
const downloadForm = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuotationController::download
* @see app/Http/Controllers/QuotationController.php:130
* @route '/quotations/{quotation}/download'
*/
downloadForm.get = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuotationController::download
* @see app/Http/Controllers/QuotationController.php:130
* @route '/quotations/{quotation}/download'
*/
downloadForm.head = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: download.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

download.form = downloadForm

const QuotationController = { store, update, updateItemStatus, download }

export default QuotationController