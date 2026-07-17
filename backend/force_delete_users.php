<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

DB::statement('PRAGMA foreign_keys = OFF;');

$keepUserIds = [2, 5, 6];

$otherUsers = User::where('role', 'Doctor')->whereNotIn('id', $keepUserIds)->get();
foreach ($otherUsers as $user) {
    DB::table('doctors')->where('user_id', $user->id)->delete();
    $user->delete();
}

DB::statement('PRAGMA foreign_keys = ON;');

echo "Successfully removed all other doctor accounts from the users table.\n";
