<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('inventory:pullout-expired')->daily();


use IlluminateSupportFacadesSchedule;
use AppModelsConsultation;

// Auto-Cancel missed consultations (Scheduled but past 2 hours)
Schedule::call(function () {
    Consultation::where('status', 'Scheduled')
        ->where('scheduled_at', '<', now()->subHours(2))
        ->update(['status' => 'Missed']);
})->hourly();
