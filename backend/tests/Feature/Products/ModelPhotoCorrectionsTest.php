<?php

function correctedModelMetadata(string $filename): array
{
    $data = file_get_contents(database_path('seeders/assets/models/'.$filename.'.glb'));
    $length = unpack('V', substr($data, 12, 4))[1];
    return json_decode(substr($data, 20, $length), true, 512, JSON_THROW_ON_ERROR);
}

it('keeps the requested photo corrections in the generated models', function () {
    $rail = correctedModelMetadata('silver-glass-stair-railing-with-cross-brace-02');
    expect(collect($rail['meshes'])->pluck('name')->implode(' '))->not->toContain('Diagonal metal accent');
    $pantry = correctedModelMetadata('white-glass-front-pantry-cabinet');
    expect(collect($pantry['meshes'])->pluck('name')->implode(' '))->not->toContain('countertop', 'Counter right support', 'Counter support recessed foot');
    $window = correctedModelMetadata('white-six-panel-awning-window-with-screens-02');
    expect(collect($window['meshes'])->pluck('name')->implode(' '))->not->toContain('mesh', 'Insect screen');
    $casement = correctedModelMetadata('black-double-casement-glass-window-01');
    expect(collect($casement['meshes'])->pluck('name')->implode(' '))->toContain('Fixed center mullion');
    $shower = correctedModelMetadata('silver-frame-striped-privacy-shower-enclosure-04');
    expect(collect($shower['meshes'])->pluck('name')->implode(' '))->toContain('Rounded silver perimeter')->not->toContain('Perimeter jamb');
    $partition = correctedModelMetadata('white-frame-frosted-bathroom-partition-16');
    expect(collect($partition['meshes'])->pluck('name')->implode(' '))->toContain('Two-panel sliding section', 'Single fixed right partition');
    $overhead = correctedModelMetadata('white-louvered-overhead-kitchen-cabinet');
    expect($overhead['extras']['dimensionsMeters'][1])->toBeLessThan(1.0);
});
