import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\WorkJobController::index
* @see app/Http/Controllers/WorkJobController.php:16
* @route '/work-jobs'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/work-jobs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WorkJobController::index
* @see app/Http/Controllers/WorkJobController.php:16
* @route '/work-jobs'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::index
* @see app/Http/Controllers/WorkJobController.php:16
* @route '/work-jobs'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::index
* @see app/Http/Controllers/WorkJobController.php:16
* @route '/work-jobs'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\WorkJobController::index
* @see app/Http/Controllers/WorkJobController.php:16
* @route '/work-jobs'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::index
* @see app/Http/Controllers/WorkJobController.php:16
* @route '/work-jobs'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::index
* @see app/Http/Controllers/WorkJobController.php:16
* @route '/work-jobs'
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
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:60
* @route '/work-jobs/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/work-jobs/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:60
* @route '/work-jobs/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:60
* @route '/work-jobs/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:60
* @route '/work-jobs/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:60
* @route '/work-jobs/create'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:60
* @route '/work-jobs/create'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::create
* @see app/Http/Controllers/WorkJobController.php:60
* @route '/work-jobs/create'
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
* @see \App\Http\Controllers\WorkJobController::store
* @see app/Http/Controllers/WorkJobController.php:100
* @route '/work-jobs'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/work-jobs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WorkJobController::store
* @see app/Http/Controllers/WorkJobController.php:100
* @route '/work-jobs'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::store
* @see app/Http/Controllers/WorkJobController.php:100
* @route '/work-jobs'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WorkJobController::store
* @see app/Http/Controllers/WorkJobController.php:100
* @route '/work-jobs'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WorkJobController::store
* @see app/Http/Controllers/WorkJobController.php:100
* @route '/work-jobs'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\WorkJobController::show
* @see app/Http/Controllers/WorkJobController.php:147
* @route '/work-jobs/{workJob}'
*/
export const show = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/work-jobs/{workJob}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WorkJobController::show
* @see app/Http/Controllers/WorkJobController.php:147
* @route '/work-jobs/{workJob}'
*/
show.url = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { workJob: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { workJob: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            workJob: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        workJob: typeof args.workJob === 'object'
        ? args.workJob.id
        : args.workJob,
    }

    return show.definition.url
            .replace('{workJob}', parsedArgs.workJob.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::show
* @see app/Http/Controllers/WorkJobController.php:147
* @route '/work-jobs/{workJob}'
*/
show.get = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::show
* @see app/Http/Controllers/WorkJobController.php:147
* @route '/work-jobs/{workJob}'
*/
show.head = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\WorkJobController::show
* @see app/Http/Controllers/WorkJobController.php:147
* @route '/work-jobs/{workJob}'
*/
const showForm = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::show
* @see app/Http/Controllers/WorkJobController.php:147
* @route '/work-jobs/{workJob}'
*/
showForm.get = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WorkJobController::show
* @see app/Http/Controllers/WorkJobController.php:147
* @route '/work-jobs/{workJob}'
*/
showForm.head = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\WorkJobController::inProgress
* @see app/Http/Controllers/WorkJobController.php:160
* @route '/work-jobs/{workJob}/in-progress'
*/
export const inProgress = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: inProgress.url(args, options),
    method: 'put',
})

inProgress.definition = {
    methods: ["put"],
    url: '/work-jobs/{workJob}/in-progress',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\WorkJobController::inProgress
* @see app/Http/Controllers/WorkJobController.php:160
* @route '/work-jobs/{workJob}/in-progress'
*/
inProgress.url = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { workJob: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { workJob: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            workJob: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        workJob: typeof args.workJob === 'object'
        ? args.workJob.id
        : args.workJob,
    }

    return inProgress.definition.url
            .replace('{workJob}', parsedArgs.workJob.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::inProgress
* @see app/Http/Controllers/WorkJobController.php:160
* @route '/work-jobs/{workJob}/in-progress'
*/
inProgress.put = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: inProgress.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\WorkJobController::inProgress
* @see app/Http/Controllers/WorkJobController.php:160
* @route '/work-jobs/{workJob}/in-progress'
*/
const inProgressForm = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: inProgress.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WorkJobController::inProgress
* @see app/Http/Controllers/WorkJobController.php:160
* @route '/work-jobs/{workJob}/in-progress'
*/
inProgressForm.put = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: inProgress.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

inProgress.form = inProgressForm

/**
* @see \App\Http\Controllers\WorkJobController::complete
* @see app/Http/Controllers/WorkJobController.php:166
* @route '/work-jobs/{workJob}/complete'
*/
export const complete = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: complete.url(args, options),
    method: 'put',
})

complete.definition = {
    methods: ["put"],
    url: '/work-jobs/{workJob}/complete',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\WorkJobController::complete
* @see app/Http/Controllers/WorkJobController.php:166
* @route '/work-jobs/{workJob}/complete'
*/
complete.url = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { workJob: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { workJob: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            workJob: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        workJob: typeof args.workJob === 'object'
        ? args.workJob.id
        : args.workJob,
    }

    return complete.definition.url
            .replace('{workJob}', parsedArgs.workJob.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::complete
* @see app/Http/Controllers/WorkJobController.php:166
* @route '/work-jobs/{workJob}/complete'
*/
complete.put = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: complete.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\WorkJobController::complete
* @see app/Http/Controllers/WorkJobController.php:166
* @route '/work-jobs/{workJob}/complete'
*/
const completeForm = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: complete.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WorkJobController::complete
* @see app/Http/Controllers/WorkJobController.php:166
* @route '/work-jobs/{workJob}/complete'
*/
completeForm.put = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: complete.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

complete.form = completeForm

/**
* @see \App\Http\Controllers\WorkJobController::cancel
* @see app/Http/Controllers/WorkJobController.php:172
* @route '/work-jobs/{workJob}/cancel'
*/
export const cancel = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cancel.url(args, options),
    method: 'put',
})

cancel.definition = {
    methods: ["put"],
    url: '/work-jobs/{workJob}/cancel',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\WorkJobController::cancel
* @see app/Http/Controllers/WorkJobController.php:172
* @route '/work-jobs/{workJob}/cancel'
*/
cancel.url = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { workJob: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { workJob: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            workJob: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        workJob: typeof args.workJob === 'object'
        ? args.workJob.id
        : args.workJob,
    }

    return cancel.definition.url
            .replace('{workJob}', parsedArgs.workJob.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WorkJobController::cancel
* @see app/Http/Controllers/WorkJobController.php:172
* @route '/work-jobs/{workJob}/cancel'
*/
cancel.put = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cancel.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\WorkJobController::cancel
* @see app/Http/Controllers/WorkJobController.php:172
* @route '/work-jobs/{workJob}/cancel'
*/
const cancelForm = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WorkJobController::cancel
* @see app/Http/Controllers/WorkJobController.php:172
* @route '/work-jobs/{workJob}/cancel'
*/
cancelForm.put = (args: { workJob: number | { id: number } } | [workJob: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

cancel.form = cancelForm

const workJobs = {
    index: Object.assign(index, index),
    create: Object.assign(create, create),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    inProgress: Object.assign(inProgress, inProgress),
    complete: Object.assign(complete, complete),
    cancel: Object.assign(cancel, cancel),
}

export default workJobs