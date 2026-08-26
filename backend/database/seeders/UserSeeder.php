<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientRecord;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Admin Accounts
        User::updateOrCreate(['email' => 'admin@cabuyao.gov.ph'], [
            'name' => 'System Admin',
            'password' => Hash::make('password123'),
            'role' => 'Admin',
            'first_login' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        User::updateOrCreate(['email' => 'e.gamundoy@gmail.com'], [
            'name' => 'E. Gamundoy',
            'password' => Hash::make('password123'),
            'role' => 'Admin',
            'first_login' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 2. Create Exactly 3 General Doctors
        $doctorsData = [
            [
                'email' => 'doctor@cabuyao.gov.ph',
                'name' => 'Dr. Jose Dela Cruz',
                'license_no' => 'PRC-1234567',
                'ptr_no' => 'PTR-8765431',
            ],
            [
                'email' => 'doctor2@cabuyao.gov.ph',
                'name' => 'Dr. Maria Teresa Santos',
                'license_no' => 'PRC-7890123',
                'ptr_no' => 'PTR-8765432',
            ],
            [
                'email' => 'doctor3@cabuyao.gov.ph',
                'name' => 'Dr. Carlos Mendoza',
                'license_no' => 'PRC-3456789',
                'ptr_no' => 'PTR-8765433',
            ]
        ];

        foreach ($doctorsData as $doc) {
            $doctorUser = User::updateOrCreate(['email' => $doc['email']], [
                'name' => $doc['name'],
                'password' => Hash::make('password123'),
                'role' => 'Doctor',
                'first_login' => false,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            
            Doctor::updateOrCreate(['user_id' => $doctorUser->id], [
                'specialization' => 'General Medicine',
                'license_no' => $doc['license_no'],
                'ptr_no' => $doc['ptr_no'],
            ]);
        }

        // 3. Create Default Patient Accounts (with barangay address, categories & records)
        $defaultPatients = [
            ['email' => 'patient@gmail.com', 'name' => 'CHO Patient', 'dob' => '1995-05-15', 'address' => 'Pulo, Cabuyao, Laguna', 'category' => 'Adult'],
            ['email' => 'staanajulianalouise44@gmail.com', 'name' => 'Juliana Louise Sta Ana', 'dob' => '2004-10-22', 'address' => 'Mamatid, Cabuyao, Laguna', 'category' => 'Adult'],
            ['email' => 'johnpeterpro13@gmail.com', 'name' => 'John Peter', 'dob' => '1960-03-30', 'address' => 'San Isidro, Cabuyao, Laguna', 'category' => 'Senior Citizen']
        ];

        foreach ($defaultPatients as $dp) {
            $regDate = \Carbon\Carbon::create(2026, rand(6, 8), rand(1, 25), rand(8, 17), rand(0, 59));
            $user = User::updateOrCreate(['email' => $dp['email']], [
                'name' => $dp['name'],
                'password' => Hash::make('password123'),
                'role' => 'Patient',
                'first_login' => false,
                'is_active' => true,
                'email_verified_at' => $regDate,
                'created_at' => $regDate,
                'updated_at' => $regDate,
            ]);

            $patient = Patient::updateOrCreate(['user_id' => $user->id], [
                'dob' => $dp['dob'],
                'address' => $dp['address'],
                'category' => $dp['category'],
                'contact_no' => '09' . rand(100000000, 999999999),
                'created_at' => $regDate,
                'updated_at' => $regDate,
            ]);

            PatientRecord::updateOrCreate(['patient_id' => $patient->id], [
                'medical_history' => 'No significant prior illnesses. Follow-up for routine health check.',
                'created_at' => $regDate,
                'updated_at' => $regDate,
            ]);
        }

        // 4. Generate 90 additional random Filipino patients (5 for each of the 18 Cabuyao Barangays)
        // This ensures every barangay has a complete age demographic footprint (Pediatric, Adult, Senior, PWD)
        $barangays = [
            'Baclaran',
            'Banay-Banay',
            'Banlic',
            'Bigaa',
            'Butong',
            'Casile',
            'Diezmo',
            'Gulod',
            'Mamatid',
            'Marinig',
            'Niugan',
            'Pittland',
            'Pulo',
            'Sala',
            'San Isidro',
            'Poblacion I',
            'Poblacion II',
            'Poblacion III'
        ];

        $firstNamesMale = ['Juan', 'Jose', 'Pedro', 'Manuel', 'Antonio', 'Ramon', 'Francisco', 'Ricardo', 'Roberto', 'Eduardo', 'Danilo', 'Rolando', 'Ferdinand', 'Benigno', 'Salvador', 'Gregorio', 'Emilio', 'Andres', 'Apolinario', 'Renato', 'Julio', 'Jaime', 'Mario', 'Nestor', 'Orlando'];
        $firstNamesFemale = ['Maria', 'Ana', 'Teresa', 'Corazon', 'Imelda', 'Gloria', 'Cecilia', 'Leonora', 'Josefina', 'Lourdes', 'Carmelita', 'Divina', 'Leticia', 'Evelyn', 'Fe', 'Esperanza', 'Paz', 'Aurora', 'Christina', 'Susan', 'Zenaida', 'Rosario', 'Pacita'];
        $lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Cruz', 'Diaz', 'Mendoza', 'Garcia', 'Ramos', 'Aquino', 'Marcos', 'Castro', 'Flores', 'Lopez', 'Gonzales', 'Bautista', 'Rivera', 'Torres', 'Mercado', 'Santiago', 'Sebastian', 'Del Rosario', 'Villanueva', 'Sarmiento', 'Dumlao', 'Pascual'];

        $patientIndex = 0;
        foreach ($barangays as $barangay) {
            $address = "$barangay, Cabuyao, Laguna";
            
            // Structuring demographic targets for each barangay
            $categories = [
                ['cat' => 'Pediatric', 'year_min' => 2009, 'year_max' => 2021],     // Kids & teens
                ['cat' => 'Senior Citizen', 'year_min' => 1946, 'year_max' => 1966], // Seniors
                ['cat' => 'PWD', 'year_min' => 1970, 'year_max' => 2005],            // PWD adults
                ['cat' => 'Adult', 'year_min' => 1970, 'year_max' => 2005],          // Regular adults
                ['cat' => 'Adult', 'year_min' => 1970, 'year_max' => 2005],          // Regular adults
            ];

            foreach ($categories as $cData) {
                $isMale = rand(0, 1) === 0;
                $firstName = $isMale ? $firstNamesMale[array_rand($firstNamesMale)] : $firstNamesFemale[array_rand($firstNamesFemale)];
                $lastName = $lastNames[array_rand($lastNames)];
                
                $name = $firstName . ' ' . $lastName;
                $email = strtolower(str_replace(' ', '', $firstName)) . '.' . strtolower(str_replace(' ', '', $lastName)) . $patientIndex . '@example.com';
                
                $year = rand($cData['year_min'], $cData['year_max']);
                $month = str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT);
                $day = str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT);
                $dob = "$year-$month-$day";
                $regDate = \Carbon\Carbon::create(2026, rand(6, 8), rand(1, 25), rand(8, 17), rand(0, 59));

                $user = User::updateOrCreate(['email' => $email], [
                    'name' => $name,
                    'password' => Hash::make('password123'),
                    'role' => 'Patient',
                    'first_login' => false,
                    'is_active' => true,
                    'email_verified_at' => $regDate,
                    'created_at' => $regDate,
                    'updated_at' => $regDate,
                ]);

                $patient = Patient::updateOrCreate(['user_id' => $user->id], [
                    'dob' => $dob,
                    'address' => $address,
                    'category' => $cData['cat'],
                    'contact_no' => '09' . rand(100000000, 999999999),
                    'created_at' => $regDate,
                    'updated_at' => $regDate,
                ]);

                // Create medical history details matching their demographic segment
                $histories = [
                    'No known drug allergies or chronic diseases.',
                    'History of mild asthma in childhood.',
                    'Allergic to seafood.',
                ];
                if ($cData['cat'] === 'PWD') {
                    $histories = [
                        'Patient has chronic orthopedic impairment. Undergoing physical therapy.',
                        'Patient has visual impairment. Uses corrective lenses.',
                        'Patient has hearing impairment. Uses hearing aid.',
                    ];
                } elseif ($cData['cat'] === 'Senior Citizen') {
                    $histories = [
                        'Diagnosed with Hypertension in 2020. Under maintenance therapy.',
                        'History of Type 2 Diabetes Mellitus. Managing with diet and oral hypoglycemic agents.',
                        'Mild osteoarthritis in knees. No other major issues.',
                    ];
                }

                PatientRecord::updateOrCreate(['patient_id' => $patient->id], [
                    'medical_history' => $histories[array_rand($histories)],
                ]);

                $patientIndex++;
            }
        }
    }
}
