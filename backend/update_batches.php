<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MedicineBatch;
use Illuminate\Support\Str;

$batches = MedicineBatch::all();
$prefixes = ['LOT-', 'B', 'RX', 'PH', 'MD', 'L-'];

foreach ($batches as $batch) {
    $prefix = $prefixes[array_rand($prefixes)];
    
    // Generate realistic pharma batch numbers
    if ($prefix === 'LOT-') {
        // e.g. LOT-829104
        $newBatch = $prefix . rand(100000, 999999);
    } elseif ($prefix === 'B' || $prefix === 'L-') {
        // e.g. B2405AX (Year + Month + Random Letters)
        $newBatch = $prefix . rand(23, 26) . str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT) . strtoupper(Str::random(2));
    } else {
        // e.g. PH8391A
        $newBatch = $prefix . rand(1000, 9999) . strtoupper(Str::random(1));
    }

    $batch->batch_number = $newBatch;
    $batch->save();
}

echo "Realistic batch numbers generated.\n";
