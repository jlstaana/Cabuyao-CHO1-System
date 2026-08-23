<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\{User, Patient};

$firstNamesMale = ['Mark', 'John', 'Michael', 'Christian', 'Joshua', 'Jayson', 'Ryan', 'Kevin', 'Paul', 'Richard', 'Angelo', 'Jerome', 'Anthony', 'Kenneth', 'Jay'];
$firstNamesFemale = ['Maria', 'Mary', 'Jennifer', 'Michelle', 'Anna', 'Cristina', 'Sarah', 'Jessica', 'Angelica', 'Grace', 'Maricel', 'Jocelyn', 'Rhea', 'Aileen', 'Cherry'];
$lastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Villanueva', 'Ramos', 'Flores', 'Gonzales', 'Perez', 'Domingo', 'Castro', 'Aquino', 'Navarro', 'Tolentino'];

$patients = User::where('role', 'Patient')->get();

foreach ($patients as $index => $user) {
    // 50/50 chance for male/female name
    if (rand(0, 1)) {
        $first = $firstNamesMale[array_rand($firstNamesMale)];
    } else {
        $first = $firstNamesFemale[array_rand($firstNamesFemale)];
    }
    
    // Add a chance for a second first name
    if (rand(0, 100) > 60) {
        if (in_array($first, $firstNamesMale)) {
            $first .= ' ' . $firstNamesMale[array_rand($firstNamesMale)];
        } else {
            $first .= ' ' . $firstNamesFemale[array_rand($firstNamesFemale)];
        }
    }

    $last = $lastNames[array_rand($lastNames)];
    
    $name = $first . ' ' . $last;
    
    $user->update(['name' => $name]);
}

echo "Updated " . $patients->count() . " patients with normal PH names.\n";
