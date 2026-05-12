<?php
// app/Http/Controllers/Categories/CategoryController.php

namespace App\Http\Controllers\Categories;

use App\Http\Controllers\Controller;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categoryService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->when(
                $request->search,
                fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
            )
            ->latest()
            ->get();

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        try {
            $category = $this->categoryService->create($request->validated());

            return response()->json([
                'message' => 'Category created successfully.',
                'data'    => new CategoryResource($category),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Failed to create category', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while creating the category.',
            ], 500);
        }
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'data' => new CategoryResource($category),
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        try {
            $category = $this->categoryService->update(
                $category,
                $request->validated()
            );

            return response()->json([
                'message' => 'Category updated successfully.',
                'data'    => new CategoryResource($category),
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to update category', [
                'category_id' => $category->id,
                'error'       => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while updating the category.',
            ], 500);
        }
    }

    public function destroy(Category $category): JsonResponse
    {
        try {
            $this->categoryService->delete($category);

            return response()->json([
                'message' => 'Category deleted successfully.',
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to delete category', [
                'category_id' => $category->id,
                'error'       => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while deleting the category.',
            ], 500);
        }
    }
}
