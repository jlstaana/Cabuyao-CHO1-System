<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\{User, Doctor, Patient};

$firstNamesM = ['Juan', 'Jose', 'Pedro', 'Miguel', 'Rafael', 'Carlos', 'Luis', 'Antonio', 'Manuel', 'Francisco', 'Ramon', 'Eduardo', 'Ricardo'];
$firstNamesF = ['Maria', 'Ana', 'Carmen', 'Teresa', 'Rosario', 'Lourdes', 'Josefina', 'Rosa', 'Elena', 'Patricia', 'Luz', 'Consuelo'];
$lastNames = ['Dela Cruz', 'Garcia', 'Reyes', 'Ramos', 'Mendoza', 'Santos', 'Flores', 'Gonzales', 'Bautista', 'Villanueva', 'Fernandez', 'Cruz', 'De Leon', 'Ocampo', 'Tolentino', 'Domingo'];

// Update Doctor Names
$doctors = Doctor::with('user')->get();
foreach ($doctors as $doctor) {
    if ($doctor->user && str_starts_with($doctor->user->email, 'dr.fake')) {
        $first = rand(0, 1) ? $firstNamesM[array_rand($firstNamesM)] : $firstNamesF[array_rand($firstNamesF)];
        $last = $lastNames[array_rand($lastNames)];
        $doctor->user->update([
            'name' => "Dr. " . $first . " " . $last
        ]);
    }
}

// Update Patient Names
$patients = Patient::with('user')->get();
foreach ($patients as $patient) {
    if ($patient->user && str_starts_with($patient->user->email, 'patient.fake')) {
        $first = rand(0, 1) ? $firstNamesM[array_rand($firstNamesM)] : $firstNamesF[array_rand($firstNamesF)];
        $last = $lastNames[array_rand($lastNames)];
        $patient->user->update([
            'name' => $first . " " . $last
        ]);
    }
}
echo "Authentic Filipino names applied.\n";
