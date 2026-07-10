<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\{User, Doctor, Patient, Consultation, ConsultationForm, VitalSign, Prescription, PrescriptionItem, Medicine, AuditLog};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

echo "Generating hyper-realistic data...\n";

$faker = \Faker\Factory::create();

// Create 5 Doctors
$specializations = ['General Practice', 'Internal Medicine', 'Pediatrics', 'Family Medicine'];
$doctors = [];
for ($i = 1; $i <= 5; $i++) {
    $email = "dr.fake{$i}@example.com";
    $user = User::firstOrCreate(
        ['email' => $email],
        [
            'name' => "Dr. " . $faker->firstName . " " . $faker->lastName,
            'password' => Hash::make('password'),
            'role' => 'Doctor',
            'is_active' => true,
            'onboarding_completed' => true,
            'email_verified_at' => now(),
        ]
    );
    $doctor = Doctor::firstOrCreate(
        ['user_id' => $user->id],
        [
            'specialization' => $specializations[array_rand($specializations)],
            'license_no' => 'PRC-' . rand(100000, 999999),
            'doctor_type' => 'Resident',
        ]
    );
    $doctors[] = $doctor;
}

// Create 30 Patients
$patients = [];
for ($i = 1; $i <= 30; $i++) {
    $email = "patient.fake{$i}@example.com";
    $user = User::firstOrCreate(
        ['email' => $email],
        [
            'name' => $faker->name,
            'password' => Hash::make('password'),
            'role' => 'Patient',
            'is_active' => true,
            'onboarding_completed' => true,
            'email_verified_at' => now(),
        ]
    );
    $patient = Patient::firstOrCreate(
        ['user_id' => $user->id],
        [
            'dob' => $faker->dateTimeBetween('-70 years', '-10 years')->format('Y-m-d'),
            'address' => $faker->address,
            'contact_no' => '09' . rand(100000000, 999999999),
            'archived' => false,
            'category' => $faker->randomElement(['General', 'Senior Citizen', 'PWD', 'Pregnant']),
        ]
    );
    $patients[] = $patient;
}

$medicines = Medicine::with('batches')->where('status', true)->get();

$diagnoses = [
    'Essential (primary) hypertension' => ['Amlodipine', 'Losartan'],
    'Type 2 diabetes mellitus' => ['Metformin', 'Gliclazide'],
    'Acute upper respiratory infection' => ['Amoxicillin', 'Paracetamol', 'Cetirizine'],
    'Asthma, unspecified' => ['Salbutamol', 'Prednisone'],
    'Acute gastroenteritis' => ['Loperamide', 'Oral Rehydration Salts'],
    'Urinary tract infection' => ['Cefuroxime', 'Ciprofloxacin'],
    'Allergic rhinitis' => ['Cetirizine', 'Loratadine'],
    'Osteoarthritis' => ['Ibuprofen', 'Celecoxib'],
    'Migraine' => ['Ibuprofen', 'Paracetamol'],
];

// Generate 150 consultations for the current month
$startDate = now()->startOfMonth();
$endDate = now();

for ($i = 0; $i < 150; $i++) {
    $patient = $patients[array_rand($patients)];
    $doctor = $doctors[array_rand($doctors)];
    
    // Random date within the current month
    $randomDays = rand(0, max(0, $endDate->diffInDays($startDate)));
    $consultDate = $startDate->copy()->addDays($randomDays)->addHours(rand(8, 16));
    if ($consultDate->gt(now())) {
        $consultDate = now()->subMinutes(rand(10, 100)); // Cap it to today if it overflowed
    }
    
    $statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Scheduled', 'Scheduled', 'Pending'];
    $status = $statuses[array_rand($statuses)];
    
    $consultation = Consultation::create([
        'patient_id' => $patient->id,
        'doctor_id' => $status !== 'Pending' ? $doctor->id : null,
        'status' => $status,
        'type' => $faker->randomElement(['Video Call', 'Chat', 'Audio Call']),
        'scheduled_at' => $status === 'Scheduled' ? $consultDate->copy()->addDays(rand(1,3)) : $consultDate,
        'created_at' => $consultDate,
        'updated_at' => $status === 'Completed' ? $consultDate->copy()->addMinutes(rand(15, 45)) : $consultDate,
    ]);

    // Vitals
    VitalSign::create([
        'consultation_id' => $consultation->id,
        'patient_id' => $patient->id,
        'blood_pressure' => rand(110, 140) . '/' . rand(70, 90),
        'heart_rate' => rand(60, 100),
        'temperature' => rand(365, 385) / 10,
        'respiratory_rate' => rand(12, 20),
        'weight' => rand(50, 90),
        'height' => rand(150, 180),
        'created_at' => $consultDate,
    ]);

    if ($status === 'Completed') {
        $diagnosisNames = array_keys($diagnoses);
        $diag = $diagnosisNames[array_rand($diagnosisNames)];
        $possibleMeds = $diagnoses[$diag];

        ConsultationForm::create([
            'consultation_id' => $consultation->id,
            'chief_complaint' => $faker->sentence(rand(3, 8)),
            'history_of_present_illness' => $faker->paragraph(rand(1, 3)),
            'past_medical_history' => $faker->randomElement(['None', 'Hypertension', 'Diabetes', 'Asthma']),
            'physical_examination' => 'Unremarkable except for noted complaint.',
            'diagnosis' => $diag,
            'treatment_plan' => 'Advised rest and prescribed medications.',
            'doctor_notes' => 'Follow up if symptoms persist.',
            'created_at' => $consultDate,
        ]);

        // Prescription
        if (rand(1, 10) > 3) {
            $prescription = Prescription::create([
                'consultation_id' => $consultation->id,
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'notes' => 'Take with meals.',
                'doctor_signature_svg' => '<svg></svg>',
                'created_at' => $consultDate,
            ]);

            // Try to find matching medicines in DB to prescribe
            $prescribedCount = rand(1, 3);
            for ($k=0; $k<$prescribedCount; $k++) {
                $medName = $possibleMeds[array_rand($possibleMeds)];
                $med = $medicines->first(function($m) use ($medName) {
                    return stripos($m->name, $medName) !== false || stripos($m->generic_name, $medName) !== false;
                });
                if (!$med && count($medicines) > 0) $med = $medicines->random();

                if ($med) {
                    PrescriptionItem::create([
                        'prescription_id' => $prescription->id,
                        'medicine_id' => $med->id,
                        'dosage' => rand(1, 2) . ' tablet(s)',
                        'frequency' => rand(1, 3) . ' times a day',
                        'duration' => rand(3, 7) . ' days',
                        'instructions' => 'As directed.',
                    ]);
                }
            }
        }
    }
}

// Few audit logs
for ($i = 0; $i < 20; $i++) {
    AuditLog::create([
        'user_id' => User::inRandomOrder()->first()->id ?? 1,
        'action' => 'User logged in',
        'description' => 'System access',
        'ip_address' => '192.168.1.' . rand(1, 255),
        'created_at' => now()->subDays(rand(0, 5))->subHours(rand(0, 23)),
    ]);
}

echo "Hyper-realistic data generated successfully!\n";
