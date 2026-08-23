<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\{User, Patient};
use Carbon\Carbon;

$names = [
    'Juan Dela Cruz',
    'Maria Santos',
    'Jose Rizal',
    'Andres Bonifacio',
    'Emilio Aguinaldo',
    'Apolinario Mabini',
    'Gabriela Silang',
    'Melchora Aquino',
    'Lapu-Lapu',
    'Antonio Luna',
    'Gregorio Del Pilar',
    'Marcelo H. Del Pilar',
    'Graciano Lopez Jaena',
    'Carlos P. Garcia',
    'Ramon Magsaysay',
    'Diosdado Macapagal',
    'Corazon Aquino',
    'Fidel V. Ramos',
    'Gloria Macapagal Arroyo',
    'Benigno Aquino III',
];

$dobs = [
    '1940-01-01', // 86 years old (older)
    '1950-05-15', // 76 years old (older)
    '1960-08-20', // 66 years old (older)
    '1975-11-30', // 51 years old (current/middle-aged)
    '1985-02-14', // 41 years old (current/middle-aged)
    '1995-07-04', // 31 years old (current/young adult)
    '2005-12-25', // 21 years old (young)
    '2015-09-10', // 11 years old (child)
    '2022-03-05', // 4 years old (toddler)
];

$patients = User::where('role', 'Patient')->get();

foreach ($patients as $index => $user) {
    // Pick a name or use random if out of bounds
    $name = $names[$index % count($names)];
    
    // Pick a random DOB
    $dob = $dobs[array_rand($dobs)];
    
    $user->update(['name' => $name]);
    
    if ($user->patient) {
        $user->patient->update(['dob' => clone Carbon::parse($dob)->addDays(rand(1, 300))]);
    }
}

echo "Updated " . $patients->count() . " patients with new names and DOBs.\n";
