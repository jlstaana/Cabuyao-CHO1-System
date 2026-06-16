<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Staff;
use App\Models\Patient;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Admin Account
        User::updateOrCreate(['email' => 'admin@cabuyao.gov.ph'], [
            'name' => 'System Admin',
            'password' => Hash::make('password123'),
            'role' => 'Admin',
            'first_login' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 2. Create Doctor Account
        $doctorUser = User::updateOrCreate(['email' => 'doctor@cabuyao.gov.ph'], [
            'name' => 'CHO Doctor',
            'password' => Hash::make('password123'),
            'role' => 'Doctor',
            'first_login' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        
        Doctor::updateOrCreate(['user_id' => $doctorUser->id], [
            'specialization' => 'General Medicine',
            'license_no' => 'LIC-123456',
        ]);

        // 3. Create Staff Account
        $staffUser = User::updateOrCreate(['email' => 'staff@cabuyao.gov.ph'], [
            'name' => 'CHO Staff',
            'password' => Hash::make('password123'),
            'role' => 'Staff',
            'first_login' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        
        Staff::updateOrCreate(['user_id' => $staffUser->id], [
            'department' => 'Records',
        ]);

        // 4. Create Patient Account
        $patientUser = User::updateOrCreate(['email' => 'patient@gmail.com'], [
            'name' => 'CHO Patient',
            'email' => 'patient@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'Patient',
            'first_login' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        Patient::updateOrCreate(['user_id' => $patientUser->id], [
            'dob' => null,
            'address' => null,
            'contact_no' => null,
        ]);

        // Requested Admin Account
        User::updateOrCreate(['email' => 'e.gamundoy@gmail.com'], [
            'name' => 'E. Gamundoy',
            'password' => Hash::make('password123'),
            'role' => 'Admin',
            'first_login' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Requested Patient Accounts
        $extraPatients = [
            ['email' => 'staanajulianalouise44@gmail.com', 'name' => 'Juliana Louise Sta Ana'],
            ['email' => 'lazadobrenda@gmail.com', 'name' => 'Brenda Lazado'],
            ['email' => 'johnpeterpro13@gmail.com', 'name' => 'John Peter']
        ];

        foreach ($extraPatients as $ep) {
            $epUser = User::updateOrCreate(['email' => $ep['email']], [
                'name' => $ep['name'],
                'password' => Hash::make('password123'),
                'role' => 'Patient',
                'first_login' => false,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            Patient::updateOrCreate(['user_id' => $epUser->id], [
                'dob' => null,
                'address' => null,
                'contact_no' => null,
            ]);
        }

        // 5. Create 25 Specialists (5 for each: General Medicine, Cardiology, Pulmonology, Psychiatry, Endocrinology)
        $specializations = [
            'General Medicine' => ['Dr. Mark Reyes', 'Dr. Carlo Mendoza', 'Dr. Dennis Cruz', 'Dr. Rowena Santos', 'Dr. Liza Bautista'],
            'Cardiology' => ['Dr. Paolo Garcia', 'Dr. Albert Villanueva', 'Dr. Sarah Fernandez', 'Dr. Joel Gonzales', 'Dr. Anna Torres'],
            'Pulmonology' => ['Dr. Maria Lopez', 'Dr. Grace Ramos', 'Dr. Katrina Flores', 'Dr. Ryan Rivera', 'Dr. Michael Perez'],
            'Psychiatry' => ['Dr. Richard Castillo', 'Dr. Joseph Gomez', 'Dr. Elena Diaz', 'Dr. Karen Morales', 'Dr. Patricia Castro'],
            'Endocrinology' => ['Dr. Michelle Ocampo', 'Dr. Jessica De Leon', 'Dr. Kevin Aguilar', 'Dr. Angela Pascual', 'Dr. Bryan Navarro']
        ];

        foreach ($specializations as $spec => $doctors) {
            foreach ($doctors as $index => $name) {
                // Ensure unique email
                $lastName = explode(' ', $name)[1];
                $email = strtolower($lastName) . strtolower(substr($spec, 0, 3)) . $index . '@cabuyao.gov.ph';
                
                $doctorUser = User::updateOrCreate(['email' => $email], [
                    'name' => $name,
                    'password' => Hash::make('password123'),
                    'role' => 'Doctor',
                    'first_login' => false,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
                
                Doctor::updateOrCreate(['user_id' => $doctorUser->id], [
                    'specialization' => $spec,
                    'license_no' => 'LIC-' . strtoupper(substr($spec, 0, 3)) . rand(10000, 99999),
                ]);
            }
        }
    }
}
