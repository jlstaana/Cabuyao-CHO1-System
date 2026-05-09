<?php
$base = __DIR__;

function write_file($path, $content) {
    global $base;
    $full = $base . '/' . $path;
    file_put_contents($full, trim($content) . "\n");
}

write_file('app/Http/Controllers/ConsultationController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, VitalSign, MedicalImage, ConsultationForm};
use Illuminate\Http\Request;

class ConsultationController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        $query = Consultation::with(['patient.user', 'doctor.user', 'vitalSigns', 'medicalImages', 'form']);
        if ($user->role === 'Patient') {
            $query->where('patient_id', $user->patient->id);
        } elseif ($user->role === 'Doctor') {
            $query->where('doctor_id', $user->doctor->id)->orWhereNull('doctor_id');
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }
    public function requestConsultation(Request $request) {
        $c = Consultation::create(['patient_id' => $request->user()->patient->id, 'status' => 'Pending']);
        return response()->json($c);
    }
    public function recordVitals(Request $request, $id) {
        $v = VitalSign::updateOrCreate(['consultation_id' => $id], $request->all());
        return response()->json($v);
    }
    public function uploadImage(Request $request, $id) {
        $request->validate(['image' => 'required|mimes:jpg,png,pdf|max:10240']);
        $path = $request->file('image')->store('medical_images', 'public');
        $img = MedicalImage::create(['consultation_id' => $id, 'patient_id' => $request->user()->patient->id, 'file_path' => $path, 'file_type' => $request->file('image')->extension(), 'file_size' => $request->file('image')->getSize()]);
        return response()->json($img);
    }
    public function updateStatus(Request $request, $id) {
        $c = Consultation::findOrFail($id);
        $c->update(['status' => $request->status, 'scheduled_at' => $request->scheduled_at]);
        if ($request->status === 'Approved' && $request->has('doctor_id')) {
            $c->update(['doctor_id' => $request->doctor_id]);
        }
        return response()->json($c);
    }
    public function complete(Request $request, $id) {
        $c = Consultation::findOrFail($id);
        $c->update(['status' => 'Completed', 'doctor_id' => $request->user()->doctor->id]);
        ConsultationForm::create(['consultation_id' => $id, 'symptoms' => $request->symptoms, 'diagnosis' => $request->diagnosis, 'notes' => $request->notes]);
        return response()->json($c->load('form'));
    }
}
EOF
);

write_file('app/Http/Controllers/PrescriptionController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{Prescription, PrescriptionItem};
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PrescriptionController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        if ($user->role === 'Patient') {
            return response()->json(Prescription::where('patient_id', $user->patient->id)->with('items.medicine', 'doctor.user')->get());
        }
        return response()->json(Prescription::with('items.medicine', 'patient.user', 'doctor.user')->get());
    }
    public function store(Request $request) {
        $p = Prescription::create(['consultation_id' => $request->consultation_id, 'patient_id' => $request->patient_id, 'doctor_id' => $request->user()->doctor->id, 'notes' => $request->notes]);
        foreach($request->items as $item) {
            $p->items()->create($item);
        }
        return response()->json($p->load('items'));
    }
    public function download($id) {
        $prescription = Prescription::with(['items.medicine', 'patient.user', 'doctor.user'])->findOrFail($id);
        $pdf = Pdf::loadHTML('<h1>E-Prescription for ' . $prescription->patient->user->name . '</h1><p>Doctor: ' . $prescription->doctor->user->name . '</p><ul>' . $prescription->items->map(fn($i) => "<li>{$i->medicine->name} - {$i->dosage} ({$i->frequency})</li>")->join('') . '</ul>');
        return $pdf->download("prescription_{$id}.pdf");
    }
}
EOF
);

write_file('app/Http/Controllers/AnalyticsController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, PrescriptionItem};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller {
    public function stats(Request $request) {
        $query = Consultation::query();
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }
        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        $consultationVolume = (clone $query)->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')->orderBy('date')->get();

        $byStatus = (clone $query)->select('status', DB::raw('count(*) as total'))->groupBy('status')->get();

        $prescQuery = PrescriptionItem::join('prescriptions', 'prescription_items.prescription_id', '=', 'prescriptions.id')
            ->join('medicines', 'prescription_items.medicine_id', '=', 'medicines.id');

        if ($request->has('medicine_category')) {
            $prescQuery->where('medicines.category', $request->medicine_category);
        }

        $topMedicines = $prescQuery->select('medicines.name', 'medicines.category', DB::raw('count(*) as total'))
            ->groupBy('medicines.name', 'medicines.category')->orderByDesc('total')->limit(10)->get();

        return response()->json([
            'time_based_volume' => $consultationVolume,
            'consultations_by_status' => $byStatus,
            'top_medicines' => $topMedicines
        ]);
    }
}
EOF
);

write_file('routes/api.php', <<<'EOF'
<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{AuthController, PatientController, AdminController, ConsultationController, MedicineController, PrescriptionController, AnalyticsController};

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    
    // Patient Profile & History
    Route::get('/patients/profile', [PatientController::class, 'profile']);
    Route::put('/patients/profile', [PatientController::class, 'updateProfile']);
    Route::get('/patients/history', [PatientController::class, 'history']);

    // Consultations
    Route::get('/consultations', [ConsultationController::class, 'index']);
    Route::post('/consultations/request', [ConsultationController::class, 'requestConsultation']);
    Route::post('/consultations/{id}/vitals', [ConsultationController::class, 'recordVitals']);
    Route::post('/consultations/{id}/images', [ConsultationController::class, 'uploadImage']);
    Route::put('/consultations/{id}/status', [ConsultationController::class, 'updateStatus']);
    Route::post('/consultations/{id}/complete', [ConsultationController::class, 'complete']);
    
    // Medicines & Prescriptions
    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::post('/medicines', [MedicineController::class, 'store'])->middleware('role:Admin');
    Route::put('/medicines/{id}', [MedicineController::class, 'update'])->middleware('role:Admin');
    Route::delete('/medicines/{id}', [MedicineController::class, 'deactivate'])->middleware('role:Admin');
    
    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{id}/download', [PrescriptionController::class, 'download']);

    // Admin Users
    Route::post('/admin/doctors', [AdminController::class, 'createDoctor'])->middleware('role:Admin');
    Route::post('/admin/staff', [AdminController::class, 'createStaff'])->middleware('role:Admin');

    // Analytics
    Route::get('/analytics/stats', [AnalyticsController::class, 'stats']);
});
EOF
);

echo "Advanced Features Patched.\n";
