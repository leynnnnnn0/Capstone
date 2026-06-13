<?php

use App\Models\QuotationItem;
use App\Models\QuotationItemImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('uploads before images for a quotation item', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);
    $quotationItem = QuotationItem::factory()->create();

    $response = $this->actingAs($admin)->postJson("/api/v1/quotation-items/{$quotationItem->id}/images", [
        'type' => 'before',
        'caption' => 'Before installation',
        'images' => [
            UploadedFile::fake()->image('before.jpg', 800, 600),
        ],
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.0.type', 'before')
        ->assertJsonPath('data.0.caption', 'Before installation')
        ->assertJsonPath('data.0.uploaded_by_id', $admin->id)
        ->assertJsonPath('data.0.can_delete', true);

    Storage::disk('public')->assertExists($quotationItem->images()->first()->image_path);
});

it('prevents non admins from deleting images uploaded by another user', function () {
    Storage::fake('public');
    $worker = User::factory()->create(['role' => 'worker']);
    $uploader = User::factory()->create(['role' => 'worker']);
    $quotationItem = QuotationItem::factory()->create();
    $quotationItem->quotation->appointment->workers()->attach($worker->id);
    $image = createQuotationItemImage($quotationItem, $uploader);

    $this->actingAs($worker)
        ->deleteJson("/api/v1/quotation-item-images/{$image->id}")
        ->assertForbidden()
        ->assertJsonPath('message', 'You can only delete photos that you uploaded.');

    $this->assertDatabaseHas('quotation_item_images', ['id' => $image->id]);
    Storage::disk('public')->assertExists($image->image_path);
});

it('prevents sub admins from deleting images uploaded by another user', function () {
    Storage::fake('public');
    $subAdmin = User::factory()->create(['role' => 'sub_admin']);
    $uploader = User::factory()->create(['role' => 'worker']);
    $quotationItem = QuotationItem::factory()->create();
    $image = createQuotationItemImage($quotationItem, $uploader);

    $this->actingAs($subAdmin)
        ->deleteJson("/api/v1/quotation-item-images/{$image->id}")
        ->assertForbidden()
        ->assertJsonPath('message', 'You can only delete photos that you uploaded.');

    $this->assertDatabaseHas('quotation_item_images', ['id' => $image->id]);
    Storage::disk('public')->assertExists($image->image_path);
});

it('allows non admins to delete images they uploaded', function () {
    Storage::fake('public');
    $worker = User::factory()->create(['role' => 'worker']);
    $quotationItem = QuotationItem::factory()->create();
    $quotationItem->quotation->appointment->workers()->attach($worker->id);
    $image = createQuotationItemImage($quotationItem, $worker);

    $this->actingAs($worker)
        ->deleteJson("/api/v1/quotation-item-images/{$image->id}")
        ->assertOk();

    $this->assertDatabaseMissing('quotation_item_images', ['id' => $image->id]);
    Storage::disk('public')->assertMissing($image->image_path);
});

it('allows admins to delete any quotation item image', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);
    $uploader = User::factory()->create(['role' => 'worker']);
    $quotationItem = QuotationItem::factory()->create();
    $image = createQuotationItemImage($quotationItem, $uploader);

    $this->actingAs($admin)
        ->deleteJson("/api/v1/quotation-item-images/{$image->id}")
        ->assertOk();

    $this->assertDatabaseMissing('quotation_item_images', ['id' => $image->id]);
    Storage::disk('public')->assertMissing($image->image_path);
});

function createQuotationItemImage(QuotationItem $quotationItem, User $uploader): QuotationItemImage
{
    $path = 'quotation-item-images/test-photo.jpg';
    Storage::disk('public')->put($path, 'fake image');

    return $quotationItem->images()->create([
        'uploaded_by_id' => $uploader->id,
        'image_path' => $path,
        'type' => 'before',
        'sort_order' => 0,
    ]);
}
