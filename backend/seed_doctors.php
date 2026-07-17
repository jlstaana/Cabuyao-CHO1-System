<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Consultation;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

$specializations = ['Cardiology', 'Pediatrics', 'General Practice'];
$doctors = [];
foreach ($specializations as $index => $spec) {
    $email = 'doctor' . ($index + 1) . '@cho1.com';
    $user = User::firstOrCreate(['email' => $email], ['name' => 'Dr. ' . $spec . ' Specialist', 'password' => Hash::make('password123'), 'role' => 'Doctor']);
    $doctors[] = Doctor::firstOrCreate(['user_id' => $user->id], ['specialization' => $spec, 'license_no' => 'LIC-' . rand(1000, 9999)]);
}

$patientUser = User::firstOrCreate(['email' => 'patient1@cho1.com'], ['name' => 'John Doe', 'password' => Hash::make('password123'), 'role' => 'Patient']);
$patient = Patient::firstOrCreate(['user_id' => $patientUser->id], ['date_of_birth' => '1990-01-01', 'gender' => 'Male', 'address' => 'Cabuyao, Laguna', 'contact_number' => '09123456789']);

$statuses = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];
for ($i = 0; $i < 15; $i++) {
    $doc = $doctors[array_rand($doctors)];
    $scheduledAt = Carbon::now()->subDays(rand(-5, 30))->setHour(rand(9, 16))->setMinute(0)->setSecond(0);
    Consultation::create(['patient_id' => $patient->id, 'doctor_id' => $doc->id, 'requested_specialization' => $doc->specialization, 'scheduled_at' => $scheduledAt, 'status' => $statuses[array_rand($statuses)]]);
}
echo "Successfully seeded 3 doctors and 15 consultations.\n";
