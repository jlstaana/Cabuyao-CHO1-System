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
    }
}
