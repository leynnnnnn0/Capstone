<?php

it('retains the annotated gate details and revised railing layouts', function () {
    $metadata = function (string $filename): array {
        $data = file_get_contents(database_path('seeders/assets/models/'.$filename.'.glb'));
        $length = unpack('V', substr($data, 12, 4))[1];
        return json_decode(substr($data, 20, $length), true, 512, JSON_THROW_ON_ERROR);
    };
    $manifest = json_decode(file_get_contents(database_path('seeders/assets/models/shower-gate-models.json')), true);
    $checks = [
        '03' => ['Tall bars between spears', 'Short spear pickets', 'Fleur-de-lis curled lobes'],
        '05' => ['Outer crossing grille', 'Meeting-side rectangular motif'],
        '06' => ['Horizontal handle above solid panel'],
        '07' => ['Fixed sidelight bars', 'Inset stile beside open vertical gap'],
        '08' => ['Upper inset grille', 'Inset stile beside open vertical gap'],
        '09' => ['Inset stile beside open vertical gap'],
        '10' => ['Inset stile beside open vertical gap', 'Bars between boards'],
        '11' => ['Aligned lower solid panels', 'Arched leaf header'],
        '12' => ['Pointed botanical leaf', 'Tulip petals', 'Silver edging above and below wood', 'Sculpted spear tip'],
        '13' => ['Slanted split solid panel', 'Slanted slot trim', 'Panel support across side gap'],
        '14' => ['Interrupted picket bottom', 'Interrupted picket top'],
        '15' => ['Upper mirrored return', 'Lower mirrored return'],
    ];
    foreach ($manifest as $name => $file) {
        if (! str_contains($name, 'Gate ')) continue;
        $number = substr($name, -2);
        if (! isset($checks[$number])) continue;
        $doc = $metadata(substr($file, 0, -4));
        $names = collect($doc['meshes'])->pluck('name');
        foreach ($checks[$number] as $detail) {
            expect($names->implode(' '))->toContain($detail);
        }
        $leafFrames = $names->filter(fn ($n) => str_ends_with($n, '/ Leaf frame'))->count();
        if (in_array($number, ['06', '08', '13'])) {
            expect($leafFrames)->toBe(['06' => 2, '08' => 4, '13' => 3][$number]);
        }
        if ($number === '14') expect($doc['extras']['dimensionsMeters'][0])->toBeGreaterThan(4.8);
        if ($number === '03') expect($doc['extras']['dimensionsMeters'][1])->toBeGreaterThan(2.2);
    }
    $stair = $metadata('silver-glass-stair-railing-with-cross-brace-02');
    expect($stair['extras']['dimensionsMeters'][2])->toBeGreaterThan(1.5)
        ->and(collect($stair['meshes'])->pluck('name')->implode(' '))->toContain('Perpendicular stair return');
    $landing = $metadata('silver-frame-glass-landing-railing-03');
    expect($landing['extras']['dimensionsMeters'][0])->toBeGreaterThan(3.2);
    $black = $metadata('black-frame-glass-balcony-railing-04');
    expect($black['extras']['dimensionsMeters'][0])->toBeGreaterThan(4)
        ->and($black['extras']['dimensionsMeters'][2])->toBeGreaterThan(2);
});
