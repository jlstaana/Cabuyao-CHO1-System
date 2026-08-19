<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$req = Illuminate\Http\Request::create('/api/consultations/request', 'POST', [
    'requested_specialization' => 'General',
    'scheduled_at' => '2026-08-19T10:30',
    'symptoms' => 'Fever',
    'vitals' => [
        'height' => '170'
    ]
]);
$user = App\Models\User::where('role', 'Patient')->first();
$req->setUserResolver(fn() => $user);
$controller = new App\Http\Controllers\ConsultationController();
try {
    $controller->requestConsultation($req);
    echo 'SUCCESS';
} catch (\Throwable $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n" . $e->getTraceAsString();
}
