<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Doctor;
use App\Models\Consultation;

$doctors = Doctor::with('user')->get();
echo "Doctors:\n";
foreach ($doctors as $d) {
    echo "ID: {$d->id}, Name: {$d->user->name}, Spec: {$d->specialization}\n";
}

echo "\nConsultations count per Doctor ID:\n";
$counts = Consultation::selectRaw('doctor_id, count(*) as total')->groupBy('doctor_id')->get();
foreach ($counts as $c) {
    echo "Doctor ID: {$c->doctor_id}, Count: {$c->total}\n";
}
