<?php
$base = __DIR__;

function write_file($path, $content) {
    global $base;
    $full = $base . '/' . $path;
    file_put_contents($full, trim($content) . "\n");
}

write_file('app/Http/Controllers/AdminController.php', <<<'EOF'
<?php
namespace App\Http\Controllers;
use App\Models\{User, Doctor, Staff, AuditLog};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller {
    public function getUsers() {
        return response()->json(User::with(['doctor', 'staff', 'patient'])->get());
    }
    public function createDoctor(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'specialization' => 'required']);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make('password123'), 'role' => 'Doctor', 'first_login' => true]);
        Doctor::create(['user_id' => $user->id, 'specialization' => $request->specialization, 'license_no' => $request->license_no ?? '']);
        AuditLog::create(['user_id' => $request->user()->id, 'action' => "Created Doctor $user->email", 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Doctor created', 'user' => $user]);
    }
    public function createStaff(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'department' => 'required']);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make('password123'), 'role' => 'Staff', 'first_login' => true]);
        Staff::create(['user_id' => $user->id, 'department' => $request->department]);
        AuditLog::create(['user_id' => $request->user()->id, 'action' => "Created Staff $user->email", 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Staff created', 'user' => $user]);
    }
}
EOF
);

write_file('database/seeders/MedicineSeeder.php', <<<'EOF'
<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Medicine;

class MedicineSeeder extends Seeder {
    public function run(): void {
        Medicine::create(['name' => 'Paracetamol 500mg', 'category' => 'Analgesic', 'description' => 'For fever and mild pain', 'stock_quantity' => 1500, 'reorder_level' => 200, 'is_active' => true]);
        Medicine::create(['name' => 'Amoxicillin 250mg', 'category' => 'Antibiotic', 'description' => 'For bacterial infections', 'stock_quantity' => 800, 'reorder_level' => 100, 'is_active' => true]);
        Medicine::create(['name' => 'Loratadine 10mg', 'category' => 'Antihistamine', 'description' => 'For allergies', 'stock_quantity' => 450, 'reorder_level' => 50, 'is_active' => true]);
    }
}
EOF
);

write_file('database/seeders/ConsultationSeeder.php', <<<'EOF'
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
EOF
);

write_file('database/seeders/DatabaseSeeder.php', <<<'EOF'
<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        $this->call([
            UserSeeder::class,
            MedicineSeeder::class,
            ConsultationSeeder::class
        ]);
    }
}
EOF
);
