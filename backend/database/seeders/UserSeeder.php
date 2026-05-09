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
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@cabuyao.gov.ph',
            'password' => Hash::make('password123'),
            'role' => 'Admin',
            'first_login' => false,
            'is_active' => true,
        ]);

        // 2. Create Doctor Account
        $doctorUser = User::create([
            'name' => 'Dr. Jane Smith',
            'email' => 'doctor@cabuyao.gov.ph',
            'password' => Hash::make('password123'),
            'role' => 'Doctor',
            'first_login' => false,
            'is_active' => true,
        ]);
        
        Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'General Medicine',
            'license_no' => 'LIC-123456',
        ]);

        // 3. Create Staff Account
        $staffUser = User::create([
            'name' => 'John Desk',
            'email' => 'staff@cabuyao.gov.ph',
            'password' => Hash::make('password123'),
            'role' => 'Staff',
            'first_login' => false,
            'is_active' => true,
        ]);
        
        Staff::create([
            'user_id' => $staffUser->id,
            'department' => 'Records',
        ]);

        // 4. Create Patient Account
        $patientUser = User::create([
            'name' => 'Juan Dela Cruz',
            'email' => 'patient@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'Patient',
            'first_login' => false,
            'is_active' => true,
        ]);

        Patient::create([
            'user_id' => $patientUser->id,
            'dob' => '1990-01-01',
            'address' => 'Brgy. Banlic, Cabuyao City',
            'contact_no' => '09123456789',
        ]);
    }
}
