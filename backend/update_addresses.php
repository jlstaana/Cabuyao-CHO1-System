<?php
require __DIR__ . "/vendor/autoload.php";
$app = require_once __DIR__ . "/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Patient;

$barangays = [
    "Baclaran, Cabuyao City",
    "Banay-Banay, Cabuyao City",
    "Banlic, Cabuyao City",
    "Bigaa, Cabuyao City",
    "Butong, Cabuyao City",
    "Casile, Cabuyao City",
    "Diezmo, Cabuyao City",
    "Gulod, Cabuyao City",
    "Mamatid, Cabuyao City",
    "Marinig, Cabuyao City",
    "Niugan, Cabuyao City",
    "Pittland, Cabuyao City",
    "Pulo, Cabuyao City",
    "Sala, Cabuyao City",
    "San Isidro, Cabuyao City",
    "Tres Cruses, Cabuyao City",
    "Uno (Poblacion), Cabuyao City",
    "Dos (Poblacion), Cabuyao City",
    "Tres (Poblacion), Cabuyao City"
];

$patients = Patient::all();
foreach ($patients as $p) {
    $p->address = $barangays[array_rand($barangays)];
    $p->save();
}

echo "Addresses updated to Cabuyao City barangays successfully!";

