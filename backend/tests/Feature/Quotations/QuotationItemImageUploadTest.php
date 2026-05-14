<?php

use App\Models\QuotationItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('uploads before images for a quotation item', function () {
    Storage::fake('public');
    $quotationItem = QuotationItem::factory()->create();

    $response = $this->postJson("/api/v1/quotation-items/{$quotationItem->id}/images", [
        'type' => 'before',
        'caption' => 'Before installation',
        'images' => [
            UploadedFile::fake()->image('before.jpg', 800, 600),
        ],
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.0.type', 'before')
        ->assertJsonPath('data.0.caption', 'Before installation');

    Storage::disk('public')->assertExists($quotationItem->images()->first()->image_path);
});
