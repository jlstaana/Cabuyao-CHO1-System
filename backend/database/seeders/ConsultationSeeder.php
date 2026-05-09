<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\{User, Consultation, Prescription, PrescriptionItem};

class ConsultationSeeder extends Seeder {
    public function run(): void {
        $patient = User::where('role', 'Patient')->first()->patient;
        $doctor = User::where('role', 'Doctor')->first()->doctor;

        $c1 = Consultation::create(['patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'status' => 'Pending']);
        $c2 = Consultation::create(['patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'status' => 'Scheduled', 'scheduled_at' => now()->addDays(1)]);
        $c3 = Consultation::create(['patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'status' => 'Completed', 'scheduled_at' => now()->subDays(1)]);

        $p = Prescription::create(['consultation_id' => $c3->id, 'patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'notes' => 'Take after meals']);
        PrescriptionItem::create(['prescription_id' => $p->id, 'medicine_id' => 1, 'dosage' => '1 tablet', 'frequency' => 'Every 8 hours']);
    }
}
