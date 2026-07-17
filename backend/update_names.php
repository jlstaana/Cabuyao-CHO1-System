<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Doctor;
use Illuminate\Support\Facades\DB;

$doctors = Doctor::with('user')->orderBy('id')->get();

$newNames = [
    'Dr. Andrea Villanueva',
    'Dr. Miguel Reyes',
    'Dr. Carlos Mendoza'
];

$i = 0;
foreach ($doctors as $doc) {
    if ($i < 3) {
        $user = $doc->user;
        if ($user) {
            $user->name = $newNames[$i];
            $user->save();
        }
        $i++;
    }
}

echo "Successfully updated the doctor names to realistic Filipino names.\n";
