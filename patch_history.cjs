const fs = require('fs');

// 1. Add history method to ConsultationController
let cc = fs.readFileSync('backend/app/Http/Controllers/ConsultationController.php', 'utf-8');
const historyMethod = `
    public function history(Request $request) {
        $user = $request->user();
        $query = Consultation::with(['patient.user', 'doctor.user', 'form', 'prescription.items.medicine'])
            ->orderBy('created_at', 'desc');

        if ($user->role === 'Patient') {
            $query->where('patient_id', $user->patient->id);
        } elseif ($user->role === 'Doctor') {
            $query->where('doctor_id', $user->doctor->id);
        }

        return response()->json($query->get());
    }
`;
if (!cc.includes('function history(Request $request)')) {
    cc = cc.replace(/class ConsultationController extends Controller \{/, `$&` + '\n' + historyMethod);
    fs.writeFileSync('backend/app/Http/Controllers/ConsultationController.php', cc);
}

// 2. Add route to api.php
let routes = fs.readFileSync('backend/routes/api.php', 'utf-8');
if (!routes.includes("Route::get('/history'")) {
    routes = routes.replace("Route::get('/patients/history', [PatientController::class, 'history']);", 
        "Route::get('/patients/history', [PatientController::class, 'history']);\n    Route::get('/history', [ConsultationController::class, 'history']);");
    fs.writeFileSync('backend/routes/api.php', routes);
}

// 3. Update ConsultationHistory.jsx
let ch = fs.readFileSync('frontend/src/pages/dashboard/ConsultationHistory.jsx', 'utf-8');
ch = ch.replace("api.get('/patients/history')", "api.get('/history')");
// Update the toHistoryItem to handle doctor view (show patient name instead of doctor name if doctor)
ch = ch.replace(
  "doctor: c.doctor?.user?.name ? `Dr. ${(c.doctor.user.name || '').replace(/^Dr\\.\\s*/i, '')}` : 'Doctor to be assigned',",
  "doctor: c.doctor?.user?.name ? `Dr. ${(c.doctor.user.name || '').replace(/^Dr\\.\\s*/i, '')}` : 'Doctor to be assigned',\n    patient: c.patient?.user?.name || 'Unknown Patient',"
);
fs.writeFileSync('frontend/src/pages/dashboard/ConsultationHistory.jsx', ch);
console.log('Patched history');
