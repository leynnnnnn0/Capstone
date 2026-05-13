import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:20
* @route '/admin/products'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:20
* @route '/admin/products'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:20
* @route '/admin/products'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:20
* @route '/admin/products'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:20
* @route '/admin/products'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:20
* @route '/admin/products'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:20
* @route '/admin/products'
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
* @see \App\Http\Controllers\ProductController::create
* @see app/Http/Controllers/ProductController.php:71
* @route '/admin/products/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/products/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::create
* @see app/Http/Controllers/ProductController.php:71
* @route '/admin/products/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::create
* @see app/Http/Controllers/ProductController.php:71
* @route '/admin/products/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::create
* @see app/Http/Controllers/ProductController.php:71
* @route '/admin/products/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::create
* @see app/Http/Controllers/ProductController.php:71
* @route '/admin/products/create'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::create
* @see app/Http/Controllers/ProductController.php:71
* @route '/admin/products/create'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::create
* @see app/Http/Controllers/ProductController.php:71
* @route '/admin/products/create'
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
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:79
* @route '/admin/products'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/products',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:79
* @route '/admin/products'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:79
* @route '/admin/products'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:79
* @route '/admin/products'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:79
* @route '/admin/products'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:165
* @route '/admin/products/{product}'
*/
export const show = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/products/{product}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:165
* @route '/admin/products/{product}'
*/
show.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:165
* @route '/admin/products/{product}'
*/
show.get = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:165
* @route '/admin/products/{product}'
*/
show.head = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:165
* @route '/admin/products/{product}'
*/
const showForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:165
* @route '/admin/products/{product}'
*/
showForm.get = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:165
* @route '/admin/products/{product}'
*/
showForm.head = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\ProductController::edit
* @see app/Http/Controllers/ProductController.php:281
* @route '/admin/products/{product}/edit'
*/
export const edit = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/products/{product}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::edit
* @see app/Http/Controllers/ProductController.php:281
* @route '/admin/products/{product}/edit'
*/
edit.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return edit.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::edit
* @see app/Http/Controllers/ProductController.php:281
* @route '/admin/products/{product}/edit'
*/
edit.get = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::edit
* @see app/Http/Controllers/ProductController.php:281
* @route '/admin/products/{product}/edit'
*/
edit.head = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::edit
* @see app/Http/Controllers/ProductController.php:281
* @route '/admin/products/{product}/edit'
*/
const editForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::edit
* @see app/Http/Controllers/ProductController.php:281
* @route '/admin/products/{product}/edit'
*/
editForm.get = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::edit
* @see app/Http/Controllers/ProductController.php:281
* @route '/admin/products/{product}/edit'
*/
editForm.head = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

edit.form = editForm

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:310
* @route '/admin/products/{product}'
*/
export const update = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/products/{product}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:310
* @route '/admin/products/{product}'
*/
update.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:310
* @route '/admin/products/{product}'
*/
update.put = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:310
* @route '/admin/products/{product}'
*/
update.patch = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:310
* @route '/admin/products/{product}'
*/
const updateForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:310
* @route '/admin/products/{product}'
*/
updateForm.put = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:310
* @route '/admin/products/{product}'
*/
updateForm.patch = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:261
* @route '/admin/products/{product}'
*/
export const destroy = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/products/{product}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:261
* @route '/admin/products/{product}'
*/
destroy.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:261
* @route '/admin/products/{product}'
*/
destroy.delete = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:261
* @route '/admin/products/{product}'
*/
const destroyForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/ProductController.php:261
* @route '/admin/products/{product}'
*/
destroyForm.delete = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

/**
* @see \App\Http\Controllers\ProductController::storeOptionGroup
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
export const storeOptionGroup = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeOptionGroup.url(args, options),
    method: 'post',
})

storeOptionGroup.definition = {
    methods: ["post"],
    url: '/products/{product}/option-groups',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::storeOptionGroup
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
storeOptionGroup.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return storeOptionGroup.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::storeOptionGroup
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
storeOptionGroup.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeOptionGroup.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::storeOptionGroup
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
const storeOptionGroupForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeOptionGroup.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::storeOptionGroup
* @see app/Http/Controllers/ProductController.php:198
* @route '/products/{product}/option-groups'
*/
storeOptionGroupForm.post = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeOptionGroup.url(args, options),
    method: 'post',
})

storeOptionGroup.form = storeOptionGroupForm

/**
* @see \App\Http\Controllers\ProductController::destroyOptionGroup
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
export const destroyOptionGroup = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyOptionGroup.url(args, options),
    method: 'delete',
})

destroyOptionGroup.definition = {
    methods: ["delete"],
    url: '/products/{product}/option-groups/{group}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductController::destroyOptionGroup
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
destroyOptionGroup.url = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions) => {
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

    return destroyOptionGroup.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace('{group}', parsedArgs.group.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::destroyOptionGroup
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
destroyOptionGroup.delete = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyOptionGroup.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductController::destroyOptionGroup
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
const destroyOptionGroupForm = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyOptionGroup.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::destroyOptionGroup
* @see app/Http/Controllers/ProductController.php:220
* @route '/products/{product}/option-groups/{group}'
*/
destroyOptionGroupForm.delete = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyOptionGroup.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyOptionGroup.form = destroyOptionGroupForm

/**
* @see \App\Http\Controllers\ProductController::storeOption
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
export const storeOption = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeOption.url(args, options),
    method: 'post',
})

storeOption.definition = {
    methods: ["post"],
    url: '/products/{product}/option-groups/{group}/options',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::storeOption
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
storeOption.url = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions) => {
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

    return storeOption.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace('{group}', parsedArgs.group.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::storeOption
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
storeOption.post = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeOption.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::storeOption
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
const storeOptionForm = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeOption.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::storeOption
* @see app/Http/Controllers/ProductController.php:229
* @route '/products/{product}/option-groups/{group}/options'
*/
storeOptionForm.post = (args: { product: number | { id: number }, group: number | { id: number } } | [product: number | { id: number }, group: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeOption.url(args, options),
    method: 'post',
})

storeOption.form = storeOptionForm

/**
* @see \App\Http\Controllers\ProductController::destroyOption
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
export const destroyOption = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyOption.url(args, options),
    method: 'delete',
})

destroyOption.definition = {
    methods: ["delete"],
    url: '/products/{product}/option-groups/{group}/options/{option}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductController::destroyOption
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
destroyOption.url = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions) => {
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

    return destroyOption.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace('{group}', parsedArgs.group.toString())
            .replace('{option}', parsedArgs.option.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductController::destroyOption
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
destroyOption.delete = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyOption.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductController::destroyOption
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
const destroyOptionForm = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyOption.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::destroyOption
* @see app/Http/Controllers/ProductController.php:254
* @route '/products/{product}/option-groups/{group}/options/{option}'
*/
destroyOptionForm.delete = (args: { product: number | { id: number }, group: number | { id: number }, option: number | { id: number } } | [product: number | { id: number }, group: number | { id: number }, option: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyOption.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyOption.form = destroyOptionForm

const ProductController = { index, create, store, show, edit, update, destroy, storeOptionGroup, destroyOptionGroup, storeOption, destroyOption }

export default ProductController