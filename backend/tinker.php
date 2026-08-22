<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'doctor@cabuyao.gov.ph')->first();
if ($user && $user->doctor) {
    $doctor = $user->doctor;
    $doctor->availability()->delete();
    
    $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    foreach ($days as $day) {
        $doctor->availability()->create([
            'day_of_week' => $day,
            'start_time' => '18:00:00',
            'end_time' => '23:59:00'
        ]);
        $doctor->availability()->create([
            'day_of_week' => $day,
            'start_time' => '00:00:00',
            'end_time' => '02:00:00'
        ]);
    }
    echo "Doctor schedule updated to night shift.";
} else {
    echo "Doctor not found.";
}
