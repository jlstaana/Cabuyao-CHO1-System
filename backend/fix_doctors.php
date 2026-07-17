<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;

DB::beginTransaction();
try {
    // We want exactly 3 doctors with these profiles
    $profiles = [
        ['name' => 'Dr. Maria Santos', 'email' => 'maria@cho1.com', 'specialization' => 'General Practice'],
        ['name' => 'Dr. Juan dela Cruz', 'email' => 'juan@cho1.com', 'specialization' => 'Pediatrics'],
        ['name' => 'Dr. Jose Rizal', 'email' => 'jose@cho1.com', 'specialization' => 'Cardiology']
    ];
    
    $keepDoctorIds = [];
    $doctors = [];

    foreach ($profiles as $profile) {
        $user = User::firstOrCreate(
            ['email' => $profile['email']],
            ['name' => $profile['name'], 'password' => bcrypt('password123'), 'role' => 'Doctor']
        );
        $user->name = $profile['name'];
        $user->save();
        
        $doctor = Doctor::firstOrCreate(
            ['user_id' => $user->id],
            ['specialization' => $profile['specialization'], 'license_no' => 'LIC-' . rand(1000, 9999)]
        );
        $doctor->specialization = $profile['specialization'];
        $doctor->save();
        
        $keepDoctorIds[] = $doctor->id;
        $doctors[] = $doctor;
    }
    
    // Find any consultation belonging to a doctor NOT in $keepDoctorIds
    $orphanConsultations = Consultation::whereNotIn('doctor_id', $keepDoctorIds)->get();
    foreach ($orphanConsultations as $c) {
        $newDoc = $doctors[array_rand($doctors)];
        $c->doctor_id = $newDoc->id;
        $c->requested_specialization = $newDoc->specialization;
        $c->save();
    }
    
    // Now delete all other doctors and their user accounts
    $otherDoctors = Doctor::whereNotIn('id', $keepDoctorIds)->get();
    foreach ($otherDoctors as $d) {
        $userId = $d->user_id;
        $d->delete();
        User::where('id', $userId)->delete();
    }
    
    DB::commit();
    echo "Successfully reduced to exactly 3 doctors, updated names, and reassigned all consultations.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
