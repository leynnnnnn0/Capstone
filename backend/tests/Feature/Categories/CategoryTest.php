<?php
// tests/Feature/Categories/CategoryTest.php

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

// ── Store ─────────────────────────────────────────────────────────

it('creates a category successfully', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/categories', [
            'name'    => 'Windows',
            'remarks' => 'All window products',
        ])
        ->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'name', 'remarks'],
        ]);

    $this->assertDatabaseHas('categories', ['name' => 'Windows']);
});

it('creates a category without remarks', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/categories', ['name' => 'Doors'])
        ->assertStatus(201);
});

// ── Update ────────────────────────────────────────────────────────

it('updates a category', function () {
    $category = Category::factory()->create(['name' => 'Old Name']);

    $this->actingAs($this->admin)
        ->putJson("/api/v1/categories/{$category->id}", ['name' => 'New Name'])
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'New Name');
});

it('allows updating a category with the same name', function () {
    $category = Category::factory()->create(['name' => 'Windows']);

    $this->actingAs($this->admin)
        ->putJson("/api/v1/categories/{$category->id}", [
            'name'    => 'Windows',
            'remarks' => 'Updated remarks',
        ])
        ->assertStatus(200);
});

// ── Delete ────────────────────────────────────────────────────────

it('deletes a category', function () {
    $category = Category::factory()->create();

    $this->actingAs($this->admin)
        ->deleteJson("/api/v1/categories/{$category->id}")
        ->assertStatus(200);

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

// ── Validation ────────────────────────────────────────────────────

it('returns 422 when name is missing', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/v1/categories', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

it('returns 422 when category name already exists', function () {
    Category::factory()->create(['name' => 'Windows']);

    $this->actingAs($this->admin)
        ->postJson('/api/v1/categories', ['name' => 'Windows'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

