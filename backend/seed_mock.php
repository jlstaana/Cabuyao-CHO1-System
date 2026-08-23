<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\{User, Doctor, Patient, Consultation, ConsultationForm, Prescription, PrescriptionItem, Medicine};
use Carbon\Carbon;

$patients = Patient::all();
$doctors = Doctor::all();
$medicines = Medicine::where('status', true)->get();
$specializations = ['General Medicine', 'Cardio', 'Pulmo', 'Mental', 'Endo'];

$symptoms = [
    'Fever and chills for 3 days',
    'Severe headache and nausea',
    'Cough with phlegm',
    'Shortness of breath',
    'Stomach ache and diarrhea',
    'Skin rash on arms',
    'Joint pain and swelling',
];

$diagnoses = [
    'Viral Infection',
    'Acute Bronchitis',
    'Gastroenteritis',
    'Migraine',
    'Allergic Contact Dermatitis',
    'Mild Asthma Exacerbation',
];

$startDate = Carbon::now()->startOfMonth();
$endDate = Carbon::now();

echo "Seeding mock data for " . $patients->count() . " patients...\n";

foreach ($patients as $patient) {
    // Generate 2-4 consultations per patient this month
    $numCons = rand(2, 4);
    
    for ($i=0; $i<$numCons; $i++) {
        $doctor = $doctors->random();
        
        // Random date this month
        $date = clone $startDate;
        $date->addDays(rand(0, $endDate->diffInDays($startDate)));
        $date->setHour(rand(8, 17));
        $date->setMinute(0);
        $date->setSecond(0);
        
        // Make some completed, some scheduled
        $status = rand(0, 100) > 30 ? 'Completed' : 'Scheduled';
        if ($date->isFuture()) {
            $status = 'Scheduled';
        } else if ($status === 'Scheduled' && $date->isPast()) {
            $status = 'Completed'; // Don't leave missed ones as scheduled
        }

        $c = Consultation::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'requested_specialization' => $doctor->specialization ?: $specializations[array_rand($specializations)],
            'scheduled_at' => $date,
            'status' => $status,
            'created_at' => (clone $date)->subDays(rand(1, 3)),
        ]);

        ConsultationForm::create([
            'consultation_id' => $c->id,
            'symptoms' => $symptoms[array_rand($symptoms)],
            'diagnosis' => $status === 'Completed' ? $diagnoses[array_rand($diagnoses)] : null,
            'notes' => $status === 'Completed' ? 'Advised patient to rest and drink plenty of fluids.' : null,
        ]);

        // 50% chance of prescription if completed
        if ($status === 'Completed' && rand(0, 1) && $medicines->count() > 0) {
            $p = Prescription::create([
                'consultation_id' => $c->id,
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'notes' => 'Take medication exactly as prescribed.',
                'created_at' => clone $date,
            ]);

            $medsCount = rand(1, 3);
            $selectedMeds = $medicines->random(min($medsCount, $medicines->count()));
            foreach ($selectedMeds as $med) {
                PrescriptionItem::create([
                    'prescription_id' => $p->id,
                    'medicine_id' => $med->id,
                    'dosage' => '500mg',
                    'frequency' => 'Every 8 hours',
                    'duration' => rand(3, 7) . ' days',
                ]);
            }
        }
    }
}

echo "Done seeding realistic mock data.\n";
