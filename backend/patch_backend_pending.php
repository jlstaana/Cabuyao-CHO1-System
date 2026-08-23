<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Consultation;

// Migrate DB
$count = Consultation::where('status', 'Pending')->update(['status' => 'Scheduled']);
echo "Migrated $count Pending consultations to Scheduled in DB\n";

// Now replace in ConsultationController.php
$ccFile = __DIR__.'/app/Http/Controllers/ConsultationController.php';
$cc = file_get_contents($ccFile);
$cc = str_replace("['Pending', 'Scheduled']", "['Scheduled']", $cc);
$cc = str_replace("->whereIn('status', ['Pending', 'Scheduled'])", "->where('status', 'Scheduled')", $cc);
$cc = str_replace("\$status = \$doctor ? 'Scheduled' : 'Pending';", "\$status = 'Scheduled';", $cc);
$cc = str_replace("if (\$status === 'Pending') {", "if (!\$doctor) {", $cc);
$cc = preg_replace('/You cannot have more than 2 active or pending consultation requests/', 'You cannot have more than 2 active scheduled consultation requests', $cc);
file_put_contents($ccFile, $cc);
echo "Patched ConsultationController\n";

// Replace in AnalyticsController.php
$acFile = __DIR__.'/app/Http/Controllers/AnalyticsController.php';
$ac = file_get_contents($acFile);
$ac = str_replace("['Pending', 'Approved', 'Scheduled']", "['Scheduled']", $ac);
$ac = str_replace("'pending_consultations'", "'scheduled_consultations'", $ac);
$ac = str_replace("\$pendingConsultations", "\$scheduledConsultations", $ac);
file_put_contents($acFile, $ac);
echo "Patched AnalyticsController\n";
