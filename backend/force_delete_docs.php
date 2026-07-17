<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Doctor;
use Illuminate\Support\Facades\DB;

// Keep the first 3 doctors
$keepIds = Doctor::orderBy('id')->take(3)->pluck('id')->toArray();

// Disable foreign keys
DB::statement('PRAGMA foreign_keys = OFF;');

$otherDoctors = Doctor::whereNotIn('id', $keepIds)->get();
foreach ($otherDoctors as $doc) {
    $userId = $doc->user_id;
    $doc->delete();
    User::where('id', $userId)->delete();
}

DB::statement('PRAGMA foreign_keys = ON;');

echo "Force deleted all extra doctors! Now there are exactly 3 doctors left in the system.\n";
