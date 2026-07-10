<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\{Doctor, Consultation, DoctorAvailability, VitalSign, ConsultationForm, Prescription, PrescriptionItem};
use Carbon\Carbon;

echo "Aligning schedules and Doctor Availability...\n";

$doctors = Doctor::all();
$days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// 1. Ensure all doctors have availability
foreach ($doctors as $doctor) {
    if ($doctor->availability()->count() === 0) {
        // Give them M-F, 8 AM to 5 PM
        foreach ($days as $day) {
            DoctorAvailability::create([
                'doctor_id' => $doctor->id,
                'day_of_week' => $day,
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
            ]);
        }
    }
}

// Re-load with availability
$doctors = Doctor::with('availability')->get()->keyBy('id');

$consultations = Consultation::all();
$now = Carbon::now();

foreach ($consultations as $consult) {
    // Determine the general target timeframe
    if ($consult->status === 'Pending' || $consult->status === 'Scheduled') {
        // Scheduled/Pending for future (or very recent past)
        $targetDate = $now->copy()->addDays(rand(1, 14));
        $createdAt = $now->copy()->subDays(rand(1, 5))->setTime(rand(8, 16), rand(0, 59));
    } else {
        // Completed: anywhere in the past 60 days
        $targetDate = $now->copy()->subDays(rand(0, 60));
        $createdAt = $targetDate->copy()->subDays(rand(1, 3))->setTime(rand(8, 16), rand(0, 59));
    }

    $scheduledAt = null;

    if ($consult->doctor_id && isset($doctors[$consult->doctor_id])) {
        $doctor = $doctors[$consult->doctor_id];
        $availabilities = $doctor->availability;

        if ($availabilities->count() > 0) {
            // Find a valid day
            $attempts = 0;
            while ($attempts < 10) {
                $dayName = $targetDate->format('l');
                $avail = $availabilities->firstWhere('day_of_week', $dayName);
                
                if ($avail) {
                    $startHour = (int) explode(':', $avail->start_time)[0];
                    $endHour = (int) explode(':', $avail->end_time)[0];
                    // Pick a random hour and minute
                    $hour = rand($startHour, max($startHour, $endHour - 1));
                    $minutes = [0, 15, 30, 45];
                    $minute = $minutes[array_rand($minutes)];
                    
                    $scheduledAt = $targetDate->copy()->setTime($hour, $minute, 0);
                    break;
                }
                $targetDate->addDay();
                $attempts++;
            }
        }
    }

    if (!$scheduledAt) {
        // Fallback if no doctor or availability logic failed
        $scheduledAt = $targetDate->setTime(rand(9, 16), [0, 15, 30, 45][array_rand([0, 15, 30, 45])], 0);
    }

    $consult->created_at = $createdAt;
    $consult->scheduled_at = $scheduledAt;
    
    if ($consult->status === 'Completed') {
        $consult->updated_at = $scheduledAt->copy()->addMinutes(rand(15, 45));
    } else {
        $consult->updated_at = $createdAt; // Just updated when created
    }
    
    $consult->save();

    // Sync related models to match the scheduled time (for realism)
    $syncTime = $scheduledAt->copy()->addMinutes(10);
    
    VitalSign::where('consultation_id', $consult->id)->update(['created_at' => $syncTime, 'updated_at' => $syncTime]);
    ConsultationForm::where('consultation_id', $consult->id)->update(['created_at' => $syncTime, 'updated_at' => $syncTime]);
    Prescription::where('consultation_id', $consult->id)->update(['created_at' => $syncTime, 'updated_at' => $syncTime]);
}

echo "Schedules successfully realigned to realistic doctor availabilities.\n";
