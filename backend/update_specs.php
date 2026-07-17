<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Doctor;
use App\Models\Consultation;

// Update all doctors to General Physician
$doctors = Doctor::all();
foreach ($doctors as $doc) {
    $doc->specialization = 'General Physician';
    $doc->save();
}

// Update all existing consultations to General Physician as well
$consultations = Consultation::all();
foreach ($consultations as $c) {
    $c->requested_specialization = 'General Physician';
    $c->save();
}

echo "Successfully updated all doctors and consultations to 'General Physician'.\n";
