<?php
$base = __DIR__;

function write_file($path, $content) {
    global $base;
    $full = $base . '/' . $path;
    $dir = dirname($full);
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    file_put_contents($full, trim($content) . "\n");
}

write_file('app/Http/Controllers/AuthController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\User;
use App\Models\Patient;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {
    public function register(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'password' => 'required|min:8', 'dob' => 'required|date', 'contact_no' => 'required']);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($request->password), 'role' => 'Patient', 'first_login' => false]);
        Patient::create(['user_id' => $user->id, 'dob' => $request->dob, 'contact_no' => $request->contact_no, 'address' => $request->address ?? '']);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Register', 'ip_address' => $request->ip()]);
        return response()->json(['token' => $user->createToken('auth')->plainTextToken, 'user' => $user]);
    }
    public function login(Request $request) {
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password) || !$user->is_active) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials or inactive account.']]);
        }
        AuditLog::create(['user_id' => $user->id, 'action' => 'Login', 'ip_address' => $request->ip()]);
        return response()->json(['token' => $user->createToken('auth')->plainTextToken, 'user' => $user]);
    }
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        AuditLog::create(['user_id' => $request->user()->id, 'action' => 'Logout', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Logged out']);
    }
    public function changePassword(Request $request) {
        $request->validate(['old_password' => 'required', 'new_password' => 'required|min:8|different:old_password']);
        $user = $request->user();
        if (!Hash::check($request->old_password, $user->password)) return response()->json(['message' => 'Invalid old password'], 400);
        $user->update(['password' => Hash::make($request->new_password), 'first_login' => false]);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Change Password', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Password changed successfully']);
    }
}
EOF
);

write_file('app/Http/Controllers/PatientController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;

class PatientController extends Controller {
    public function profile(Request $request) {
        return response()->json($request->user()->load('patient'));
    }
    public function updateProfile(Request $request) {
        $patient = $request->user()->patient;
        $patient->update($request->only(['dob', 'address', 'contact_no']));
        return response()->json($patient);
    }
    public function history(Request $request) {
        return response()->json($request->user()->patient->consultations()->with('doctor.user', 'prescription')->get());
    }
}
EOF
);

write_file('app/Http/Controllers/AdminController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{User, Doctor, Staff};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller {
    public function createDoctor(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'specialization' => 'required', 'license_no' => 'required|unique:doctors']);
        $password = Str::random(8);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($password), 'role' => 'Doctor']);
        Doctor::create(['user_id' => $user->id, 'specialization' => $request->specialization, 'license_no' => $request->license_no, 'active_until' => $request->active_until]);
        return response()->json(['message' => 'Doctor created', 'temp_password' => $password, 'user' => $user]);
    }
    public function createStaff(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'department' => 'required']);
        $password = Str::random(8);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($password), 'role' => 'Staff']);
        Staff::create(['user_id' => $user->id, 'department' => $request->department]);
        return response()->json(['message' => 'Staff created', 'temp_password' => $password, 'user' => $user]);
    }
}
EOF
);

write_file('app/Http/Controllers/ConsultationController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, VitalSign, MedicalImage, ConsultationForm};
use Illuminate\Http\Request;

class ConsultationController extends Controller {
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
        return response()->json($c);
    }
    public function complete(Request $request, $id) {
        $c = Consultation::findOrFail($id);
        $c->update(['status' => 'Completed', 'doctor_id' => $request->user()->doctor->id]);
        ConsultationForm::create(['consultation_id' => $id, 'symptoms' => $request->symptoms, 'diagnosis' => $request->diagnosis, 'notes' => $request->notes]);
        return response()->json($c);
    }
}
EOF
);

write_file('app/Http/Controllers/MedicineController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\Medicine;
use Illuminate\Http\Request;

class MedicineController extends Controller {
    public function index() { return response()->json(Medicine::where('status', true)->get()); }
    public function store(Request $request) {
        $m = Medicine::create($request->all());
        return response()->json($m);
    }
    public function update(Request $request, $id) {
        $m = Medicine::findOrFail($id);
        $m->update($request->all());
        return response()->json($m);
    }
    public function deactivate($id) {
        Medicine::findOrFail($id)->update(['status' => false]);
        return response()->json(['message' => 'Deactivated']);
    }
}
EOF
);

write_file('app/Http/Controllers/PrescriptionController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{Prescription, PrescriptionItem};
use Illuminate\Http\Request;

class PrescriptionController extends Controller {
    public function store(Request $request) {
        $p = Prescription::create(['consultation_id' => $request->consultation_id, 'patient_id' => $request->patient_id, 'doctor_id' => $request->user()->doctor->id, 'notes' => $request->notes]);
        foreach($request->items as $item) {
            $p->items()->create($item);
        }
        return response()->json($p->load('items'));
    }
    public function download($id) {
        // Pseudo-code for PDF download
        return response()->json(['message' => 'PDF generated', 'url' => url("/storage/prescriptions/{$id}.pdf")]);
    }
}
EOF
);

write_file('app/Http/Controllers/AnalyticsController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, PrescriptionItem};
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller {
    public function stats() {
        return response()->json([
            'consultations_by_status' => Consultation::select('status', DB::raw('count(*) as total'))->groupBy('status')->get(),
            'top_medicines' => PrescriptionItem::select('medicine_id', DB::raw('count(*) as total'))->groupBy('medicine_id')->with('medicine:id,name')->orderByDesc('total')->limit(5)->get()
        ]);
    }
}
EOF
);

write_file('app/Http/Middleware/RoleMiddleware.php', <<<'EOF'
<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;

class RoleMiddleware {
    public function handle(Request $request, Closure $next, $role) {
        if (!$request->user() || $request->user()->role !== $role) {
            return response()->json(['message' => 'Unauthorized role'], 403);
        }
        return $next($request);
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
    
    // Patient
    Route::get('/patients/profile', [PatientController::class, 'profile']);
    Route::put('/patients/profile', [PatientController::class, 'updateProfile']);
    Route::get('/patients/history', [PatientController::class, 'history']);

    // Consultations
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

echo "Controllers and Routes generated.\n";
