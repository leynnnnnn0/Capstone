<?php

namespace App\Enums;

enum FabricationStatus: string
{
    case NotRequired = 'not_required';
    case Pending = 'pending';
    case MaterialsPreparation = 'materials_preparation';
    case WaitingForMaterials = 'waiting_for_materials';
    case Queued = 'queued';
    case InProgress = 'in_progress';
    case QualityCheck = 'quality_check';
    case OnHold = 'on_hold';
    case ReadyForInstallation = 'ready_for_installation';

    public function label(): string
    {
        return match ($this) {
            self::NotRequired => 'No Fabrication Required',
            self::Pending => 'Fabrication Planning',
            self::MaterialsPreparation => 'Preparing Materials',
            self::WaitingForMaterials => 'Waiting for Materials',
            self::Queued => 'Queued for Fabrication',
            self::InProgress => 'Fabrication in Progress',
            self::QualityCheck => 'Quality Checking',
            self::OnHold => 'Fabrication on Hold',
            self::ReadyForInstallation => 'Ready for Installation',
        };
    }

    public function customerDescription(): string
    {
        return match ($this) {
            self::NotRequired => 'This service does not need a fabrication stage and can proceed to scheduling.',
            self::Pending => 'SOG is reviewing the final measurements and planning the fabrication work.',
            self::MaterialsPreparation => 'The materials and specifications for your order are being prepared.',
            self::WaitingForMaterials => 'SOG is waiting for the required glass, aluminum, or accessories to arrive.',
            self::Queued => 'Your order is ready and waiting for its fabrication slot.',
            self::InProgress => 'Your custom items are currently being fabricated.',
            self::QualityCheck => 'The finished items are being checked before installation scheduling.',
            self::OnHold => 'Fabrication is temporarily paused. Check the latest update below for details.',
            self::ReadyForInstallation => 'Fabrication is complete and your order is ready for installation.',
        };
    }

    public function progressPercentage(): int
    {
        return match ($this) {
            self::NotRequired => 100,
            self::Pending => 10,
            self::MaterialsPreparation => 25,
            self::WaitingForMaterials => 35,
            self::Queued => 50,
            self::InProgress => 70,
            self::QualityCheck => 90,
            self::OnHold => 50,
            self::ReadyForInstallation => 100,
        };
    }

    public function requiresExpectedCompletionDate(): bool
    {
        return ! in_array($this, [self::NotRequired, self::ReadyForInstallation], true);
    }
}
