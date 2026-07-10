<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\{User, Doctor, Patient, Medicine};

echo "Fixing names and medicine batches...\n";

// Use en_PH faker for Filipino names
$faker = \Faker\Factory::create('en_PH');

// Update Doctor Names
$doctors = Doctor::with('user')->get();
foreach ($doctors as $doctor) {
    if ($doctor->user && str_starts_with($doctor->user->email, 'dr.fake')) {
        $doctor->user->update([
            'name' => "Dr. " . $faker->firstName . " " . $faker->lastName
        ]);
    }
}

// Update Patient Names
$patients = Patient::with('user')->get();
foreach ($patients as $patient) {
    if ($patient->user && str_starts_with($patient->user->email, 'patient.fake')) {
        $patient->user->update([
            'name' => $faker->firstName . " " . $faker->lastName
        ]);
    }
}

// Fix missing batches for medicines
$medicines = Medicine::withCount('batches')->get();
foreach ($medicines as $m) {
    if ($m->batches_count === 0) {
        $stockRand = rand(1, 100);
        $stock = 0;
        if ($stockRand <= 10) $stock = 0;
        elseif ($stockRand <= 30) $stock = rand(1, 15);
        else $stock = rand(50, 300);

        if ($stock > 0) {
            $m->batches()->create([
                'batch_number' => 'LOT-' . rand(100000, 999999),
                'stock' => ceil($stock / 2),
                'expiration_date' => now()->addDays(rand(10, 365))->format('Y-m-d')
            ]);
            $m->batches()->create([
                'batch_number' => 'PH' . rand(1000, 9999) . 'X',
                'stock' => floor($stock / 2),
                'expiration_date' => now()->addYears(rand(1, 4))->format('Y-m-d')
            ]);
        }
    }
}

echo "Fix applied successfully.\n";
