<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$doctorUsers = User::where('role', 'Doctor')->get();
foreach ($doctorUsers as $u) {
    echo "User ID: {$u->id}, Name: {$u->name}, Email: {$u->email}\n";
}
