<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

DB::statement('PRAGMA foreign_keys = OFF;');
Consultation::truncate();
DB::statement('PRAGMA foreign_keys = ON;');

$doctors = Doctor::all();
$patient = Patient::first();

$statuses = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];

for ($i = 0; $i < 15; $i++) {
    $doc = $doctors[array_rand($doctors->toArray())];
    
    // Spread them across the last 15 days
    $scheduledAt = Carbon::now()->subDays(rand(0, 15))->setHour(rand(9, 16))->setMinute(0)->setSecond(0);
    
    Consultation::create([
        'patient_id' => $patient->id,
        'doctor_id' => $doc->id,
        'requested_specialization' => $doc->specialization, // General Physician
        'scheduled_at' => $scheduledAt,
        'status' => $statuses[array_rand($statuses)],
    ]);
}

echo "Successfully cleared old consultations and seeded exactly 15 transactions.\n";
