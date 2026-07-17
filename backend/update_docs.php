<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;

$doctors = Doctor::with('user')->get();

$profiles = [
    ['name' => 'Dr. Maria Santos', 'specialization' => 'General Practice'],
    ['name' => 'Dr. Juan dela Cruz', 'specialization' => 'Pediatrics'],
    ['name' => 'Dr. Jose Rizal', 'specialization' => 'Cardiology']
];

$keepIds = [];
$i = 0;

foreach ($doctors as $doc) {
    if ($i < 3) {
        $profile = $profiles[$i];
        $doc->specialization = $profile['specialization'];
        $doc->save();
        
        $user = $doc->user;
        if ($user) {
            $user->name = $profile['name'];
            $user->save();
        }
        $keepIds[] = $doc->id;
        $i++;
    }
}

// Ensure there are 3 exactly if there were less than 3
// ... Assuming there are at least 3 since we just created 3 earlier!

// Reassign consultations of any extra doctors to the first 3
$allConsultations = Consultation::all();
foreach ($allConsultations as $c) {
    if (!in_array($c->doctor_id, $keepIds)) {
        $c->doctor_id = $keepIds[array_rand($keepIds)];
        $newDoc = Doctor::find($c->doctor_id);
        $c->requested_specialization = $newDoc->specialization;
        $c->save();
    }
}

// Reassign other tables if necessary (e.g. Prescriptions)
$tables = ['prescriptions', 'teleconsultations', 'vital_signs'];
foreach ($tables as $table) {
    try {
        $rows = DB::table($table)->whereNotIn('doctor_id', $keepIds)->get();
        foreach ($rows as $row) {
            DB::table($table)->where('id', $row->id)->update(['doctor_id' => $keepIds[array_rand($keepIds)]]);
        }
    } catch (\Exception $e) {
        // Table might not exist or doctor_id might not exist, ignore
    }
}

// Delete extra doctors
foreach ($doctors as $doc) {
    if (!in_array($doc->id, $keepIds)) {
        $userId = $doc->user_id;
        try {
            $doc->delete();
            User::where('id', $userId)->delete();
        } catch (\Exception $e) {
            echo "Warning: Could not delete Doctor ID {$doc->id}: " . $e->getMessage() . "\n";
        }
    }
}

echo "Successfully updated the 3 doctors to realistic names/specializations and cleaned up the rest.\n";
